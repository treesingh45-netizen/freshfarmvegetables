import 'dotenv/config';
import crypto from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  appendAuditLog,
  getDb,
  hashPassword,
  sanitizeAddress,
  saveDb,
  signAuthToken,
  StoredUser,
  toPublicUser,
  verifyAuthToken,
  verifyPassword,
} from './server/db';
import {
  generateKitchenProcurementPlan,
  parseAdminRateSheet,
  parseQuickProduceList,
} from './server/gemini';
import {
  getWhatsAppIntegrationStatus,
  sendWhatsAppOrderNotification,
} from './server/whatsapp';
import {
  calculateCartSummary,
  validateCheckoutInput,
  validateWholesaleQuoteInput,
} from './src/utils/commerce';
import {
  CatalogCategorySlug,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PricingMode,
  ProduceOrigin,
  Product,
  QuoteInquiry,
  QuoteStatus,
  StockStatus,
} from './src/types';

interface AuthedRequest extends Request {
  user?: StoredUser | null;
}

const VALID_RECEIPT_DATA_URL = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_RECEIPT_DATA_URL_LENGTH = 4_500_000; // ~3.2 MB binary image limit

function sanitizeTransactionId(raw: unknown): string {
  return String(raw || '')
    .trim()
    .replace(/[^\w\-./:# ]+/g, '')
    .slice(0, 80);
}

function validateReceiptDataUrl(raw: unknown): { valid: boolean; cleaned: string; error?: string } {
  const str = String(raw || '').trim();
  if (!str) {
    return { valid: true, cleaned: '' };
  }
  if (str.length > MAX_RECEIPT_DATA_URL_LENGTH) {
    return {
      valid: false,
      cleaned: '',
      error: 'Uploaded payment receipt exceeds the 3 MB image limit. Please choose a smaller screenshot.',
    };
  }
  if (!VALID_RECEIPT_DATA_URL.test(str)) {
    return {
      valid: false,
      cleaned: '',
      error: 'Payment receipt must be a valid PNG, JPG, or WEBP image.',
    };
  }
  return { valid: true, cleaned: str };
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    req.user = verifyAuthToken(token);
  } else {
    req.user = null;
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator authorization required.' });
    return;
  }
  next();
}

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function canViewOrder(req: AuthedRequest, order: Order): boolean {
  const isAdmin = req.user?.role === 'admin';
  const isOwner = Boolean(req.user && order.customerId === req.user.id);
  const tokenParam = String(req.query.token || req.body?.token || '').trim();
  const emailParam = String(req.query.email || req.body?.email || '').trim().toLowerCase();

  const matchesToken = Boolean(
    tokenParam && order.accessToken && tokenParam === order.accessToken
  );
  const matchesEmail = Boolean(
    emailParam && order.contact.email.toLowerCase() === emailParam
  );

  return isAdmin || isOwner || matchesToken || matchesEmail;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '8mb' }));
  app.use(attachUser);

  // Initialize database on startup
  getDb();

  // --- Public Storefront Bootstrap ---
  app.get('/api/bootstrap', (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const isAdmin = req.user?.role === 'admin';
    const products = isAdmin ? db.products : db.products.filter((p) => p.enabled);
    res.json({
      products,
      settings: db.settings,
      user: req.user ? toPublicUser(req.user) : null,
    });
  });

  app.get('/api/products', (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const isAdmin = req.user?.role === 'admin';
    res.json({
      products: isAdmin ? db.products : db.products.filter((p) => p.enabled),
      lastDailyRatesPublishedAt: db.settings.lastDailyRatesPublishedAt,
    });
  });

  // --- Customer & Admin Authentication ---
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { fullName, email, password, phone, businessName } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(fullName || '').trim();
    const cleanPhone = String(phone || '').trim();

    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }
    if (!password || String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const db = getDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const creds = hashPassword(String(password));
    const newUser: StoredUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      businessName: String(businessName || '').trim(),
      role: 'customer',
      savedAddresses: [],
      favoriteProductIds: [],
      createdAt: new Date().toISOString(),
      passwordHash: creds.hash,
      passwordSalt: creds.salt,
    };

    db.users.push(newUser);
    saveDb();

    const token = signAuthToken(newUser.id, newUser.role);
    res.status(201).json({ token, user: toPublicUser(newUser) });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user || !password || !verifyPassword(String(password), user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    const token = signAuthToken(user.id, user.role);
    if (user.role === 'admin') {
      appendAuditLog(user.email, 'ADMIN_SIGN_IN', 'Administrator signed in.');
    }
    res.json({ token, user: toPublicUser(user) });
  });

  app.post('/api/auth/password-reset/request', (req: Request, res: Response) => {
    const { email, phone } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhoneDigits = String(phone || '').replace(/[^\d]/g, '');

    if (!cleanEmail) {
      res.status(400).json({ error: 'Enter your registered email address.' });
      return;
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || user.role === 'admin') {
      res.status(404).json({
        error:
          'No matching customer account found, or contact Fresh Farm Vegetables on WhatsApp for assistance.',
      });
      return;
    }

    const userDigits = user.phone.replace(/[^\d]/g, '');
    if (!userDigits || cleanPhoneDigits.slice(-7) !== userDigits.slice(-7)) {
      res.status(400).json({
        error: 'Phone number does not match the contact number registered on this account.',
      });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.resetCode = code;
    user.resetExpiresAt = Date.now() + 1000 * 60 * 15;
    saveDb();

    res.json({
      verificationReady: true,
      resetCode: code,
      message:
        'Identity verified against your registered phone number. Enter a new password below to complete your reset.',
    });
  });

  app.post('/api/auth/password-reset/confirm', (req: Request, res: Response) => {
    const { email, resetCode, newPassword } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (
      !user ||
      !user.resetCode ||
      user.resetCode !== String(resetCode || '').trim() ||
      !user.resetExpiresAt ||
      Date.now() > user.resetExpiresAt
    ) {
      res.status(400).json({ error: 'Invalid or expired reset code.' });
      return;
    }

    const creds = hashPassword(String(newPassword));
    user.passwordHash = creds.hash;
    user.passwordSalt = creds.salt;
    user.resetCode = null;
    user.resetExpiresAt = null;
    saveDb();

    const token = signAuthToken(user.id, user.role);
    res.json({ token, user: toPublicUser(user) });
  });

  app.get('/api/account/me', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const user = req.user!;
    const myOrders = db.orders.filter((o) => o.customerId === user.id);
    const myQuotes = db.quotes.filter((q) => q.customerId === user.id);
    res.json({
      user: toPublicUser(user),
      orders: myOrders,
      quotes: myQuotes,
    });
  });

  app.put('/api/account/profile', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { fullName, phone, businessName } = req.body || {};
    if (!String(fullName || '').trim()) {
      res.status(400).json({ error: 'Full name cannot be empty.' });
      return;
    }
    user.fullName = String(fullName).trim();
    user.phone = String(phone || '').trim();
    user.businessName = String(businessName || '').trim();
    saveDb();
    res.json({ user: toPublicUser(user) });
  });

  app.post('/api/account/favorites/toggle', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { productId } = req.body || {};
    const pid = String(productId || '');
    if (!pid) {
      res.status(400).json({ error: 'Product ID is required.' });
      return;
    }
    const idx = user.favoriteProductIds.indexOf(pid);
    if (idx >= 0) {
      user.favoriteProductIds.splice(idx, 1);
    } else {
      user.favoriteProductIds.push(pid);
    }
    saveDb();
    res.json({ favoriteProductIds: user.favoriteProductIds, user: toPublicUser(user) });
  });

  app.post('/api/account/addresses', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const addr = sanitizeAddress(req.body || {});
    if (!addr.streetAddress || !addr.firstName) {
      res.status(400).json({ error: 'Recipient first name and street address are required.' });
      return;
    }
    user.savedAddresses.push(addr);
    saveDb();
    res.status(201).json({ savedAddresses: user.savedAddresses, user: toPublicUser(user) });
  });

  app.delete('/api/account/addresses/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    user.savedAddresses = user.savedAddresses.filter((a) => a.id !== req.params.id);
    saveDb();
    res.json({ savedAddresses: user.savedAddresses, user: toPublicUser(user) });
  });

  // --- Orders (Checkout Submission, Payment Proof & WhatsApp Notification) ---
  app.post('/api/orders', async (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const {
      cartItems,
      contact,
      shippingAddress,
      paymentMethod,
      paymentProof,
      saveAddressToAccount,
    } = req.body || {};

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      res.status(400).json({ error: 'Your cart is empty.' });
      return;
    }

    const receiptCheck = validateReceiptDataUrl(paymentProof?.receiptDataUrl);
    if (!receiptCheck.valid) {
      res.status(400).json({
        error: receiptCheck.error,
        validationErrors: { paymentProof: receiptCheck.error || 'Invalid receipt image.' },
      });
      return;
    }

    const cleanTxnId = sanitizeTransactionId(paymentProof?.transactionId);
    const cleanReceiptFileName = String(paymentProof?.receiptFileName || '')
      .trim()
      .replace(/[^\w\- .()]+/g, '')
      .slice(0, 100);
    const cleanSenderInfo = String(paymentProof?.senderInfo || '')
      .trim()
      .slice(0, 120);

    const summary = calculateCartSummary(
      cartItems,
      db.products,
      db.settings,
      shippingAddress?.zoneId
    );

    const allowedMethod: PaymentMethod | '' =
      paymentMethod === 'qr_transfer' ||
      paymentMethod === 'cod' ||
      paymentMethod === 'online_card'
        ? paymentMethod
        : '';

    const validationErrors = validateCheckoutInput(
      {
        fullName: String(contact?.fullName || ''),
        email: String(contact?.email || ''),
        phone: String(contact?.phone || ''),
        firstName: String(shippingAddress?.firstName || ''),
        lastName: String(shippingAddress?.lastName || ''),
        shippingPhone: String(shippingAddress?.phone || ''),
        streetAddress: String(shippingAddress?.streetAddress || ''),
        city: String(shippingAddress?.city || ''),
        province: String(shippingAddress?.province || ''),
        zoneId: String(shippingAddress?.zoneId || ''),
        paymentMethod: allowedMethod,
        transactionId: cleanTxnId,
        hasPaymentReceipt: Boolean(receiptCheck.cleaned),
      },
      summary,
      db.settings
    );

    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({
        error: Object.values(validationErrors)[0],
        validationErrors,
        summary,
      });
      return;
    }

    const zone = db.settings.deliveryZones.find((z) => z.id === shippingAddress.zoneId)!;
    const now = new Date().toISOString();
    const seq = 1001 + db.orders.length;
    const reference = `FFV-ORD-${seq}`;
    const accessToken = crypto.randomBytes(16).toString('hex');

    const orderItems = summary.items.map((item) => ({
      productId: item.productId,
      productName: item.product!.name,
      origin: item.product!.origin,
      quantity: item.quantity,
      selectedPackage: item.selectedPackage || item.product!.priceUnit || 'Standard',
      unitPricePkr: item.unitPricePkr!,
      priceUnit: item.product!.priceUnit || 'per unit',
      lineTotalPkr: item.lineTotalPkr!,
    }));

    // CRITICAL PAYMENT SECURITY RULE:
    // Never mark an order as 'paid' automatically upon customer submission.
    // QR / Online Transfer orders remain 'pending_verification' until verified by an administrator.
    const initialPaymentStatus: PaymentStatus =
      allowedMethod === 'qr_transfer'
        ? 'pending_verification'
        : allowedMethod === 'cod'
        ? 'cod_pending'
        : 'unpaid';

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reference,
      accessToken,
      customerId: req.user ? req.user.id : null,
      contact: {
        fullName: String(contact.fullName).trim(),
        email: String(contact.email).trim(),
        phone: String(contact.phone).trim(),
        marketingConsent: Boolean(contact.marketingConsent),
      },
      shippingAddress: {
        country: String(shippingAddress.country || 'Pakistan').trim(),
        firstName: String(shippingAddress.firstName).trim(),
        lastName: String(shippingAddress.lastName).trim(),
        phone: String(shippingAddress.phone).trim(),
        streetAddress: String(shippingAddress.streetAddress).trim(),
        apartment: String(shippingAddress.apartment || '').trim(),
        city: String(shippingAddress.city).trim(),
        province: String(shippingAddress.province).trim(),
        postalCode: String(shippingAddress.postalCode || '').trim(),
        zoneId: zone.id,
        zoneName: zone.name,
        deliveryInstructions: String(shippingAddress.deliveryInstructions || '').trim(),
      },
      items: orderItems,
      subtotalPkr: summary.subtotalPkr!,
      deliveryFeePkr: summary.deliveryFeePkr,
      deliveryNote: summary.deliveryPendingConfirmation
        ? 'Your delivery options and charges will be confirmed by our team.'
        : `Confirmed zone delivery charge applied (${zone.name}).`,
      taxPkr: summary.taxPkr || 0,
      discountPkr: 0,
      grandTotalPkr: summary.grandTotalPkr,
      paymentMethod: allowedMethod as PaymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentDetails: {
        transactionId: cleanTxnId,
        receiptDataUrl: receiptCheck.cleaned,
        receiptFileName: receiptCheck.cleaned ? cleanReceiptFileName || 'payment-receipt.png' : '',
        senderInfo: cleanSenderInfo,
        submittedAt: cleanTxnId || receiptCheck.cleaned ? now : null,
        verifiedAt: null,
        verifiedBy: null,
        verificationNote: '',
      },
      status: 'pending_confirmation',
      createdAt: now,
      updatedAt: now,
    };

    // Attempt automatic WhatsApp notification to +923334934403 (or return prefilled link fallback)
    const waNotification = await sendWhatsAppOrderNotification(newOrder, db.settings);
    newOrder.whatsappNotification = waNotification;

    db.orders.unshift(newOrder);

    if (saveAddressToAccount && req.user) {
      req.user.savedAddresses.push(
        sanitizeAddress({
          label: zone.name,
          firstName: newOrder.shippingAddress.firstName,
          lastName: newOrder.shippingAddress.lastName,
          phone: newOrder.shippingAddress.phone,
          streetAddress: newOrder.shippingAddress.streetAddress,
          apartment: newOrder.shippingAddress.apartment,
          city: newOrder.shippingAddress.city,
          province: newOrder.shippingAddress.province,
          postalCode: newOrder.shippingAddress.postalCode,
          zoneId: zone.id,
        })
      );
    }

    appendAuditLog(
      newOrder.contact.email,
      'ORDER_PLACED',
      `Order ${newOrder.reference} placed (${newOrder.paymentMethod}, status=${newOrder.paymentStatus}, total=${
        newOrder.grandTotalPkr ?? newOrder.subtotalPkr
      } PKR, WhatsApp=${waNotification.deliveredAutomatically ? 'auto-sent' : 'prefilled-link'}).`
    );

    saveDb();
    res.status(201).json({ order: newOrder });
  });

  app.get('/api/orders/:reference', (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const order = db.orders.find(
      (o) => o.reference === req.params.reference || o.id === req.params.reference
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (!canViewOrder(req, order)) {
      res.status(403).json({
        error: 'Provide the order email address or sign in to view full order details.',
      });
      return;
    }

    res.json({ order });
  });

  // Allow customer to submit or update payment Transaction ID / Receipt before payment is verified
  app.post('/api/orders/:reference/payment-proof', async (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const order = db.orders.find(
      (o) => o.reference === req.params.reference || o.id === req.params.reference
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (!canViewOrder(req, order)) {
      res.status(403).json({ error: 'Unauthorized to update payment proof for this order.' });
      return;
    }
    if (order.paymentStatus === 'paid') {
      res.status(400).json({ error: 'Payment for this order has already been verified.' });
      return;
    }

    const receiptCheck = validateReceiptDataUrl(req.body?.receiptDataUrl);
    if (!receiptCheck.valid) {
      res.status(400).json({ error: receiptCheck.error });
      return;
    }

    const nextTxnId = sanitizeTransactionId(req.body?.transactionId);
    const nextReceipt = receiptCheck.cleaned || order.paymentDetails?.receiptDataUrl || '';
    const nextFileName = receiptCheck.cleaned
      ? String(req.body?.receiptFileName || 'payment-receipt.png')
          .trim()
          .replace(/[^\w\- .()]+/g, '')
          .slice(0, 100)
      : order.paymentDetails?.receiptFileName || '';
    const nextSender = String(req.body?.senderInfo ?? order.paymentDetails?.senderInfo ?? '')
      .trim()
      .slice(0, 120);

    if (nextTxnId.length < 4 && !nextReceipt) {
      res.status(400).json({
        error: 'Provide a Transaction ID (at least 4 characters) or upload a payment receipt image.',
      });
      return;
    }

    const now = new Date().toISOString();
    order.paymentMethod = 'qr_transfer';
    // Never mark paid automatically — keep pending_verification until Admin verifies
    order.paymentStatus = 'pending_verification';
    order.paymentDetails = {
      transactionId: nextTxnId || order.paymentDetails?.transactionId || '',
      receiptDataUrl: nextReceipt,
      receiptFileName: nextFileName,
      senderInfo: nextSender,
      submittedAt: now,
      verifiedAt: null,
      verifiedBy: null,
      verificationNote: order.paymentDetails?.verificationNote || '',
    };
    order.updatedAt = now;

    // Refresh WhatsApp prefilled URL / notification record with updated transaction reference
    order.whatsappNotification = await sendWhatsAppOrderNotification(order, db.settings);

    appendAuditLog(
      order.contact.email,
      'PAYMENT_PROOF_SUBMITTED',
      `Updated payment proof on ${order.reference} (txn=${order.paymentDetails.transactionId || 'none'}, receipt=${
        order.paymentDetails.receiptDataUrl ? 'yes' : 'no'
      }). Status remains pending_verification.`
    );
    saveDb();

    res.json({ order });
  });

  // --- Wholesale & Quote Inquiries ---
  app.post('/api/quotes', (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const body = req.body || {};

    const validationErrors = validateWholesaleQuoteInput({
      businessName: String(body.businessName || ''),
      contactName: String(body.contactName || ''),
      businessType: String(body.businessType || ''),
      phone: String(body.phone || ''),
      email: String(body.email || ''),
      deliveryAddress: String(body.deliveryAddress || ''),
      items: Array.isArray(body.items) ? body.items : [],
    });

    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({
        error: Object.values(validationErrors)[0],
        validationErrors,
      });
      return;
    }

    const now = new Date().toISOString();
    const seq = 2001 + db.quotes.length;
    const reference = `FFV-Q-${seq}`;

    const cleanItems = (body.items as any[])
      .filter((i) => String(i.productName || '').trim() && Number(i.quantity) > 0)
      .map((i) => ({
        productId: String(i.productId || ''),
        productName: String(i.productName).trim(),
        quantity: Math.max(1, Math.round(Number(i.quantity))),
        unitOrPackage: String(i.unitOrPackage || 'Standard').trim(),
        quotedUnitPricePkr: null,
      }));

    const inquiry: QuoteInquiry = {
      id: `qte-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reference,
      customerId: req.user ? req.user.id : null,
      source: body.source === 'cart_inquiry' ? 'cart_inquiry' : 'wholesale_form',
      businessName: String(body.businessName || '').trim(),
      contactName: String(body.contactName).trim(),
      businessType: String(body.businessType).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email || '').trim(),
      deliveryAddress: String(body.deliveryAddress).trim(),
      preferredDeliveryDate: String(body.preferredDeliveryDate || '').trim(),
      packagingRequirements: String(body.packagingRequirements || '').trim(),
      additionalNotes: String(body.additionalNotes || '').trim(),
      items: cleanItems,
      status: 'new',
      adminResponseNotes: '',
      createdAt: now,
      updatedAt: now,
    };

    db.quotes.unshift(inquiry);
    saveDb();

    res.status(201).json({ inquiry });
  });

  // --- Admin Dashboard Endpoints ---
  app.get('/api/admin/overview', requireAdmin, (_req: AuthedRequest, res: Response) => {
    const db = getDb();
    res.json({
      products: db.products,
      orders: db.orders,
      quotes: db.quotes,
      settings: db.settings,
      auditLogs: db.auditLogs,
      whatsappApiStatus: getWhatsAppIntegrationStatus(db.settings.whatsappIntl),
    });
  });

  app.post('/api/admin/products', requireAdmin, (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name) {
      res.status(400).json({ error: 'Product name is required.' });
      return;
    }

    const baseSlug = makeSlug(name);
    const slug = db.products.some((p) => p.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;

    const origin: ProduceOrigin = body.origin === 'imported' ? 'imported' : 'local';
    const pricingMode: PricingMode = body.pricingMode === 'live' ? 'live' : 'quote';
    const rawPrice =
      pricingMode === 'live' && body.pricePkr !== null && body.pricePkr !== ''
        ? Number(body.pricePkr)
        : null;

    if (pricingMode === 'live' && (!rawPrice || rawPrice <= 0)) {
      res.status(400).json({
        error:
          "Enter a valid positive PKR rate for live-priced products, or select Request Today's Rate.",
      });
      return;
    }

    const categories: CatalogCategorySlug[] = ['all', origin];
    if (body.bestseller) categories.push('bestsellers');
    if (Array.isArray(body.extraCategories)) {
      for (const c of body.extraCategories) {
        if (!categories.includes(c)) categories.push(c);
      }
    }

    const now = new Date().toISOString();
    const product: Product = {
      id: `prod-${slug}`,
      slug,
      name,
      origin,
      categories,
      isSpecialty: Boolean(body.isSpecialty),
      featured: Boolean(body.featured),
      bestseller: Boolean(body.bestseller),
      description: String(
        body.description || `${name} supplied fresh by Fresh Farm Vegetables.`
      ).trim(),
      culinaryApplications: String(
        body.culinaryApplications || 'Commercial and household kitchen prep.'
      ).trim(),
      handlingNotes: String(body.handlingNotes || 'Store in clean, cool conditions.').trim(),
      imageUrl: String(body.imageUrl || '/images/produce/hero-produce.jpg').trim(),
      galleryUrls:
        Array.isArray(body.galleryUrls) && body.galleryUrls.length > 0
          ? body.galleryUrls
          : [String(body.imageUrl || '/images/produce/hero-produce.jpg').trim()],
      packageOptions: Array.isArray(body.packageOptions)
        ? body.packageOptions.map((s: string) => String(s).trim()).filter(Boolean)
        : ['1 kg', '0.5 kg', '5 kg'],
      pricingMode,
      pricePkr: rawPrice,
      priceUnit: String(body.priceUnit || 'per kg').trim(),
      priceUpdatedAt: pricingMode === 'live' ? now : null,
      stockStatus: (['unverified', 'in_stock', 'limited', 'out_of_stock'].includes(body.stockStatus)
        ? body.stockStatus
        : 'in_stock') as StockStatus,
      enabled: body.enabled !== false,
    };

    db.products.unshift(product);
    saveDb();
    appendAuditLog(
      req.user!.email,
      'PRODUCT_CREATED',
      `Created product "${product.name}" (${product.origin}).`
    );

    res.status(201).json({ product });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const body = req.body || {};
    if (body.name !== undefined) {
      const cleanName = String(body.name).trim();
      if (!cleanName) {
        res.status(400).json({ error: 'Product name cannot be empty.' });
        return;
      }
      product.name = cleanName;
    }
    if (body.origin === 'local' || body.origin === 'imported') {
      product.origin = body.origin;
    }
    if (body.description !== undefined) product.description = String(body.description).trim();
    if (body.culinaryApplications !== undefined)
      product.culinaryApplications = String(body.culinaryApplications).trim();
    if (body.handlingNotes !== undefined)
      product.handlingNotes = String(body.handlingNotes).trim();
    if (body.imageUrl !== undefined && String(body.imageUrl).trim()) {
      product.imageUrl = String(body.imageUrl).trim();
      if (!product.galleryUrls.includes(product.imageUrl)) {
        product.galleryUrls = [product.imageUrl, ...product.galleryUrls.slice(0, 3)];
      }
    }
    if (Array.isArray(body.packageOptions)) {
      product.packageOptions = body.packageOptions
        .map((s: string) => String(s).trim())
        .filter(Boolean);
    }
    if (body.featured !== undefined) product.featured = Boolean(body.featured);
    if (body.bestseller !== undefined) product.bestseller = Boolean(body.bestseller);
    if (body.isSpecialty !== undefined) product.isSpecialty = Boolean(body.isSpecialty);
    if (body.enabled !== undefined) product.enabled = Boolean(body.enabled);

    const preserved = product.categories.filter(
      (c) =>
        c === 'iceberg-lettuce' || c === 'vacuum-packed-lettuce' || c === 'lettuce-collection'
    );
    product.categories = ['all', product.origin, ...preserved];
    if (product.bestseller && !product.categories.includes('bestsellers')) {
      product.categories.push('bestsellers');
    }

    if (
      body.stockStatus &&
      ['unverified', 'in_stock', 'limited', 'out_of_stock'].includes(body.stockStatus)
    ) {
      product.stockStatus = body.stockStatus as StockStatus;
    }

    if (body.priceUnit !== undefined) {
      product.priceUnit = String(body.priceUnit || 'per kg').trim();
    }

    if (body.pricingMode === 'quote') {
      product.pricingMode = 'quote';
      product.pricePkr = null;
    } else if (body.pricingMode === 'live') {
      const num = Number(body.pricePkr);
      if (!num || num <= 0) {
        res.status(400).json({ error: 'Valid positive PKR price required for live pricing.' });
        return;
      }
      product.pricingMode = 'live';
      product.pricePkr = Math.round(num);
      product.priceUpdatedAt = new Date().toISOString();
      db.settings.lastDailyRatesPublishedAt = product.priceUpdatedAt;
    }

    saveDb();
    appendAuditLog(
      req.user!.email,
      'PRODUCT_UPDATED',
      `Updated "${product.name}" — mode=${product.pricingMode}, price=${
        product.pricePkr ?? 'quote'
      }`
    );

    res.json({ product, lastDailyRatesPublishedAt: db.settings.lastDailyRatesPublishedAt });
  });

  app.post('/api/admin/prices/bulk-publish', requireAdmin, (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
    const now = new Date().toISOString();
    let count = 0;

    for (const upd of updates) {
      const prod = db.products.find((p) => p.id === upd.productId);
      if (!prod) continue;

      if (upd.pricingMode === 'quote' || upd.pricePkr === null || upd.pricePkr === '') {
        prod.pricingMode = 'quote';
        prod.pricePkr = null;
        count++;
      } else {
        const val = Math.round(Number(upd.pricePkr));
        if (val > 0) {
          prod.pricingMode = 'live';
          prod.pricePkr = val;
          if (upd.priceUnit) prod.priceUnit = String(upd.priceUnit).trim();
          if (
            upd.stockStatus &&
            ['unverified', 'in_stock', 'limited', 'out_of_stock'].includes(upd.stockStatus)
          ) {
            prod.stockStatus = upd.stockStatus;
          } else if (prod.stockStatus === 'unverified') {
            prod.stockStatus = 'in_stock';
          }
          prod.priceUpdatedAt = now;
          count++;
        }
      }
    }

    db.settings.lastDailyRatesPublishedAt = now;
    saveDb();
    appendAuditLog(
      req.user!.email,
      'DAILY_RATES_PUBLISHED',
      `Published daily price updates across ${count} products.`
    );

    res.json({
      products: db.products,
      lastDailyRatesPublishedAt: now,
      updatedCount: count,
    });
  });

  app.put('/api/admin/orders/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const { status, paymentStatus, deliveryFeePkr, deliveryNote, verificationNote } =
      req.body || {};
    const prevPaymentStatus = order.paymentStatus;
    const now = new Date().toISOString();

    if (status) order.status = status as OrderStatus;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus as PaymentStatus;
      if (!order.paymentDetails) {
        order.paymentDetails = {
          transactionId: '',
          receiptDataUrl: '',
          receiptFileName: '',
          senderInfo: '',
          submittedAt: null,
          verifiedAt: null,
          verifiedBy: null,
          verificationNote: '',
        };
      }
      if (paymentStatus === 'paid' && prevPaymentStatus !== 'paid') {
        order.paymentDetails.verifiedAt = now;
        order.paymentDetails.verifiedBy = req.user!.email;
        if (order.status === 'pending_confirmation') {
          order.status = 'confirmed';
        }
      } else if (paymentStatus !== 'paid') {
        order.paymentDetails.verifiedAt = null;
        order.paymentDetails.verifiedBy = null;
      }
    }

    if (verificationNote !== undefined && order.paymentDetails) {
      order.paymentDetails.verificationNote = String(verificationNote).trim().slice(0, 240);
    }

    if (deliveryFeePkr !== undefined) {
      const fee =
        deliveryFeePkr === null || deliveryFeePkr === '' ? null : Math.round(Number(deliveryFeePkr));
      order.deliveryFeePkr = fee;
      order.grandTotalPkr = order.subtotalPkr + (fee || 0) + order.taxPkr - order.discountPkr;
    }
    if (deliveryNote !== undefined) order.deliveryNote = String(deliveryNote).trim();
    order.updatedAt = now;

    saveDb();
    appendAuditLog(
      req.user!.email,
      paymentStatus === 'paid' && prevPaymentStatus !== 'paid'
        ? 'PAYMENT_VERIFIED'
        : 'ORDER_UPDATED',
      `Order ${order.reference} updated — status=${order.status}, payment=${order.paymentStatus}.`
    );

    res.json({ order });
  });

  app.put('/api/admin/quotes/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const quote = db.quotes.find((q) => q.id === req.params.id);
    if (!quote) {
      res.status(404).json({ error: 'Quote request not found.' });
      return;
    }

    const { status, adminResponseNotes, items } = req.body || {};
    if (status) quote.status = status as QuoteStatus;
    if (adminResponseNotes !== undefined) {
      quote.adminResponseNotes = String(adminResponseNotes).trim();
    }
    if (Array.isArray(items)) {
      quote.items = items.map((item: any) => ({
        productId: String(item.productId || ''),
        productName: String(item.productName || '').trim(),
        quantity: Math.max(1, Number(item.quantity) || 1),
        unitOrPackage: String(item.unitOrPackage || 'Standard').trim(),
        quotedUnitPricePkr:
          item.quotedUnitPricePkr === null ||
          item.quotedUnitPricePkr === '' ||
          item.quotedUnitPricePkr === undefined
            ? null
            : Math.round(Number(item.quotedUnitPricePkr)),
      }));
    }
    quote.updatedAt = new Date().toISOString();
    saveDb();
    appendAuditLog(
      req.user!.email,
      'QUOTE_UPDATED',
      `Updated quote ${quote.reference} to status=${quote.status}.`
    );

    res.json({ quote });
  });

  app.put('/api/admin/settings', requireAdmin, (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const body = req.body || {};

    const cleanPaymentLink = String(body.paymentLinkUrl ?? db.settings.paymentLinkUrl).trim();
    if (cleanPaymentLink && !/^https?:\/\//i.test(cleanPaymentLink)) {
      res.status(400).json({
        error: 'Official payment link must start with https:// or http://.',
      });
      return;
    }

    db.settings = {
      ...db.settings,
      phoneDisplay: String(body.phoneDisplay ?? db.settings.phoneDisplay).trim(),
      whatsappIntl: String(body.whatsappIntl ?? db.settings.whatsappIntl).trim(),
      email: String(body.email ?? db.settings.email).trim(),
      emailVerified: Boolean(body.emailVerified),
      address: String(body.address ?? db.settings.address).trim(),
      instagramUrl: String(body.instagramUrl ?? db.settings.instagramUrl).trim(),
      facebookUrl: String(body.facebookUrl ?? db.settings.facebookUrl).trim(),
      playStoreUrl: String(body.playStoreUrl ?? db.settings.playStoreUrl).trim(),
      playStoreVerified: Boolean(body.playStoreVerified),
      appStoreUrl: String(body.appStoreUrl ?? db.settings.appStoreUrl).trim(),
      appStoreVerified: Boolean(body.appStoreVerified),
      businessHours: String(body.businessHours ?? db.settings.businessHours).trim(),
      codEnabled: Boolean(body.codEnabled),
      qrPaymentEnabled:
        body.qrPaymentEnabled !== undefined
          ? Boolean(body.qrPaymentEnabled)
          : db.settings.qrPaymentEnabled,
      paymentProviderTitle: String(
        body.paymentProviderTitle ?? db.settings.paymentProviderTitle
      ).trim(),
      paymentAccountTitle: String(
        body.paymentAccountTitle ?? db.settings.paymentAccountTitle
      ).trim(),
      paymentBankOrWalletName: String(
        body.paymentBankOrWalletName ?? db.settings.paymentBankOrWalletName
      ).trim(),
      paymentAccountNumber: String(
        body.paymentAccountNumber ?? db.settings.paymentAccountNumber
      ).trim(),
      paymentQrImageUrl: String(body.paymentQrImageUrl ?? db.settings.paymentQrImageUrl).trim(),
      paymentLinkUrl: cleanPaymentLink,
      paymentInstructions: String(
        body.paymentInstructions ?? db.settings.paymentInstructions
      ).trim(),
      onlineCardEnabled: Boolean(body.onlineCardEnabled),
      onlineCardProviderName: String(
        body.onlineCardProviderName ?? db.settings.onlineCardProviderName
      ).trim(),
      taxRatePercent: Math.max(0, Number(body.taxRatePercent ?? db.settings.taxRatePercent) || 0),
      deliveryZones: Array.isArray(body.deliveryZones)
        ? body.deliveryZones
        : db.settings.deliveryZones,
    };
    saveDb();
    appendAuditLog(
      req.user!.email,
      'SETTINGS_UPDATED',
      'Updated business, payment QR/link, and delivery zone settings.'
    );

    res.json({ settings: db.settings });
  });

  // --- Gemini Intelligence Endpoints ---
  app.post('/api/ai/procurement-plan', async (req: Request, res: Response) => {
    const brief = String(req.body?.kitchenBrief || '').trim();
    if (!brief || brief.length < 5) {
      res.status(400).json({
        error: 'Describe your kitchen menu, event covers, or daily produce needs first.',
      });
      return;
    }

    try {
      const db = getDb();
      const result = await generateKitchenProcurementPlan(brief, db.products);
      res.json(result);
    } catch (err: any) {
      res.status(502).json({
        error:
          err?.message ||
          'Unable to generate kitchen procurement plan right now. You can still select products manually below.',
      });
    }
  });

  app.post('/api/ai/quick-order-parse', async (req: Request, res: Response) => {
    const rawText = String(req.body?.rawText || '').trim();
    if (!rawText) {
      res.status(400).json({ error: 'Paste or type at least one vegetable and quantity.' });
      return;
    }

    try {
      const db = getDb();
      const result = await parseQuickProduceList(rawText, db.products);
      res.json(result);
    } catch (err: any) {
      res.status(502).json({
        error: err?.message || 'Unable to parse list automatically right now.',
      });
    }
  });

  app.post(
    '/api/admin/ai/parse-rates',
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const rawRatesText = String(req.body?.rawRatesText || '').trim();
      if (!rawRatesText) {
        res.status(400).json({ error: 'Paste daily market rate notes first.' });
        return;
      }

      try {
        const db = getDb();
        const result = await parseAdminRateSheet(rawRatesText, db.products);
        res.json(result);
      } catch (err: any) {
        res.status(502).json({
          error: err?.message || 'Unable to parse daily rate notes automatically.',
        });
      }
    }
  );

  // --- Vite Dev Middleware / Production Static Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fresh Farm Vegetables server running on http://localhost:${PORT}`);
  });
}

startServer();
