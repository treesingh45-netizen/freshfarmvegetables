import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BUSINESS_SETTINGS, INITIAL_PRODUCTS } from '../data/catalogSeed';
import {
  buildMultiItemWhatsAppUrl,
  buildOrderWhatsAppUrl,
  buildProductWhatsAppUrl,
  calculateCartSummary,
  filterAndSortProducts,
  formatOrderWhatsAppMessage,
  formatPaymentStatusLabel,
  formatRs,
  resolvePackageUnitPricePkr,
  validateCheckoutInput,
  validateWholesaleQuoteInput,
} from './commerce';
import { Order, Product } from '../types';

test('catalog seed contains all 28 authentic local and imported vegetables with active PKR rates and package scaling', () => {
  assert.equal(INITIAL_PRODUCTS.length, 28);
  const localCount = INITIAL_PRODUCTS.filter((p) => p.origin === 'local').length;
  const importedCount = INITIAL_PRODUCTS.filter((p) => p.origin === 'imported').length;
  assert.equal(localCount, 16);
  assert.equal(importedCount, 12);

  for (const prod of INITIAL_PRODUCTS) {
    assert.equal(prod.pricingMode, 'live');
    assert.ok(typeof prod.pricePkr === 'number' && prod.pricePkr > 0);
    assert.ok(prod.packageOptions.length >= 2);
  }

  const iceberg = INITIAL_PRODUCTS.find((p) => p.id === 'prod-iceberg-lettuce')!;
  assert.equal(resolvePackageUnitPricePkr(iceberg, '1 kg'), 320);
  assert.equal(resolvePackageUnitPricePkr(iceberg, '0.5 kg'), 160);
  assert.equal(resolvePackageUnitPricePkr(iceberg, '5 kg'), 1600);

  const basil = INITIAL_PRODUCTS.find((p) => p.id === 'prod-basil-leaves')!;
  assert.equal(resolvePackageUnitPricePkr(basil, '250 g'), 350);
  assert.equal(resolvePackageUnitPricePkr(basil, '100 g'), 140);

  assert.equal(formatRs(374), 'Rs.374');
  assert.equal(formatRs(1850), 'Rs.1,850');
});

test('filterAndSortProducts filters by search query, origin, and lettuce collection accurately', () => {
  const lettuceItems = filterAndSortProducts(INITIAL_PRODUCTS, {
    category: 'lettuce-collection',
  });
  assert.equal(lettuceItems.length, 4);
  const slugs = lettuceItems.map((p) => p.slug);
  assert.ok(slugs.includes('iceberg-lettuce'));
  assert.ok(slugs.includes('vacuum-packed-lettuce'));
  assert.ok(slugs.includes('romaine-lettuce'));
  assert.ok(slugs.includes('lolo-rose-lettuce'));

  const importedSearch = filterAndSortProducts(INITIAL_PRODUCTS, {
    origin: 'imported',
    searchQuery: 'capsicum',
  });
  assert.equal(importedSearch.length, 2);
});

test('calculateCartSummary handles unpriced quote items without fabricating monetary totals', () => {
  const quoteCatalog: Product[] = INITIAL_PRODUCTS.map((p) =>
    p.id === 'prod-iceberg-lettuce' ? { ...p, pricingMode: 'quote', pricePkr: null } : p
  );

  const summary = calculateCartSummary(
    [
      {
        productId: 'prod-iceberg-lettuce',
        quantity: 5,
        selectedPackage: '1 kg',
        snapshotPricePkr: null,
        snapshotPricingMode: 'quote',
      },
    ],
    quoteCatalog,
    DEFAULT_BUSINESS_SETTINGS
  );

  assert.equal(summary.totalItemCount, 5);
  assert.equal(summary.hasUnpricedItems, true);
  assert.equal(summary.subtotalPkr, null);
  assert.equal(summary.grandTotalPkr, null);
  assert.equal(summary.canProceedToCheckout, false);
});

test('calculateCartSummary computes accurate PKR totals with package weights, zone delivery, and detects price changes', () => {
  const validSummary = calculateCartSummary(
    [
      {
        productId: 'prod-iceberg-lettuce',
        quantity: 3,
        selectedPackage: '1 kg',
        snapshotPricePkr: 320,
        snapshotPricingMode: 'live',
      },
      {
        productId: 'prod-tomatoes',
        quantity: 2,
        selectedPackage: '0.5 kg',
        snapshotPricePkr: 90,
        snapshotPricingMode: 'live',
      },
    ],
    INITIAL_PRODUCTS,
    DEFAULT_BUSINESS_SETTINGS,
    'lahore-dha'
  );

  assert.equal(validSummary.hasUnpricedItems, false);
  assert.equal(validSummary.hasPriceChanges, false);
  assert.equal(validSummary.canProceedToCheckout, true);
  assert.equal(validSummary.subtotalPkr, 3 * 320 + 2 * 90); // 960 + 180 = 1140
  assert.equal(validSummary.deliveryFeePkr, 150);
  assert.equal(validSummary.grandTotalPkr, 1290);

  const updatedCatalog = INITIAL_PRODUCTS.map((p) =>
    p.id === 'prod-iceberg-lettuce' ? { ...p, pricePkr: 350 } : p
  );
  const changedSummary = calculateCartSummary(
    [
      {
        productId: 'prod-iceberg-lettuce',
        quantity: 3,
        selectedPackage: '1 kg',
        snapshotPricePkr: 320,
        snapshotPricingMode: 'live',
      },
    ],
    updatedCatalog,
    DEFAULT_BUSINESS_SETTINGS,
    'lahore-dha'
  );

  assert.equal(changedSummary.hasPriceChanges, true);
  assert.equal(changedSummary.canProceedToCheckout, false);
  assert.equal(changedSummary.subtotalPkr, 1050);
});

test('WhatsApp order and inquiry URLs target +923334934403 and include all 6 required order notification fields', () => {
  const singleUrl = buildProductWhatsAppUrl('+923334934403', 'Iceberg Lettuce', {
    quantity: 10,
    selectedPackage: '5 kg',
    deliveryLocation: 'DHA Phase 6, Lahore',
  });
  assert.ok(singleUrl.startsWith('https://wa.me/923334934403?text='));

  const multiUrl = buildMultiItemWhatsAppUrl(
    '+923334934403',
    [{ productName: 'Iceberg Lettuce', quantity: 15, selectedPackage: '1 kg' }],
    { businessName: 'Bistro 6', deliveryArea: 'Phase 6 CCA' }
  );
  assert.ok(decodeURIComponent(multiUrl.split('text=')[1]).includes('Bistro 6'));

  const sampleOrder: Order = {
    id: 'ord-test-1',
    reference: 'FFV-ORD-1009',
    customerId: null,
    contact: {
      fullName: 'Bilal Ahmed',
      email: 'bilal@example.com',
      phone: '0300-4567890',
      marketingConsent: false,
    },
    shippingAddress: {
      country: 'Pakistan',
      firstName: 'Bilal',
      lastName: 'Ahmed',
      phone: '0300-4567890',
      streetAddress: 'Plot 22, Commercial CCA, Phase 6',
      apartment: 'Ground Kitchen',
      city: 'Lahore',
      province: 'Punjab',
      postalCode: '54792',
      zoneId: 'lahore-dha',
      zoneName: 'DHA Phases 1 to 8 & Commercial CCA, Lahore',
      deliveryInstructions: 'Call receiving chef on arrival',
    },
    items: [
      {
        productId: 'prod-iceberg-lettuce',
        productName: 'Iceberg Lettuce',
        origin: 'local',
        quantity: 2,
        selectedPackage: '1 kg',
        unitPricePkr: 320,
        priceUnit: 'per kg',
        lineTotalPkr: 640,
      },
    ],
    subtotalPkr: 640,
    deliveryFeePkr: 150,
    deliveryNote: 'Confirmed zone delivery charge applied.',
    taxPkr: 0,
    discountPkr: 0,
    grandTotalPkr: 790,
    paymentMethod: 'qr_transfer',
    paymentStatus: 'pending_verification',
    paymentDetails: {
      transactionId: 'RAAST-77889900',
      receiptDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
      receiptFileName: 'receipt.png',
      senderInfo: 'Bilal HBL',
      submittedAt: '2026-10-25T09:00:00.000Z',
      verifiedAt: null,
      verifiedBy: null,
      verificationNote: '',
    },
    status: 'pending_confirmation',
    createdAt: '2026-10-25T09:00:00.000Z',
    updatedAt: '2026-10-25T09:00:00.000Z',
  };

  assert.equal(formatPaymentStatusLabel(sampleOrder.paymentStatus), 'Payment Verification Pending');

  const orderText = formatOrderWhatsAppMessage(sampleOrder, DEFAULT_BUSINESS_SETTINGS);
  assert.ok(orderText.includes('Order Number: FFV-ORD-1009'));
  assert.ok(orderText.includes('Payment Status: Payment Verification Pending'));
  assert.ok(orderText.includes('Name: Bilal Ahmed'));
  assert.ok(orderText.includes('Phone: 0300-4567890'));
  assert.ok(orderText.includes('1. Iceberg Lettuce (1 kg) x 2 = PKR 640'));
  assert.ok(orderText.includes('Total Amount (PKR): PKR 790'));
  assert.ok(orderText.includes('Plot 22, Commercial CCA, Phase 6'));
  assert.ok(orderText.includes('Transaction Reference: RAAST-77889900'));

  const orderWaUrl = buildOrderWhatsAppUrl('+923334934403', sampleOrder, DEFAULT_BUSINESS_SETTINGS);
  assert.ok(orderWaUrl.startsWith('https://wa.me/923334934403?text='));
});

test('checkout validation enforces QR payment proof (Transaction ID or Receipt) and rejects missing fields', () => {
  const summary = calculateCartSummary(
    [
      {
        productId: 'prod-tomatoes',
        quantity: 2,
        selectedPackage: '1 kg',
        snapshotPricePkr: 180,
        snapshotPricingMode: 'live',
      },
    ],
    INITIAL_PRODUCTS,
    DEFAULT_BUSINESS_SETTINGS,
    'lahore-dha'
  );

  // Missing Transaction ID and Receipt on qr_transfer -> rejected
  const missingProofErrors = validateCheckoutInput(
    {
      fullName: 'Ali Khan',
      email: 'ali@example.com',
      phone: '03334934403',
      firstName: 'Ali',
      lastName: 'Khan',
      shippingPhone: '03334934403',
      streetAddress: 'Street 4, Phase 6',
      city: 'Lahore',
      province: 'Punjab',
      zoneId: 'lahore-dha',
      paymentMethod: 'qr_transfer',
      transactionId: '',
      hasPaymentReceipt: false,
    },
    summary,
    DEFAULT_BUSINESS_SETTINGS
  );
  assert.ok(missingProofErrors.paymentProof);

  // Providing Transaction ID passes
  const validTxnErrors = validateCheckoutInput(
    {
      fullName: 'Ali Khan',
      email: 'ali@example.com',
      phone: '03334934403',
      firstName: 'Ali',
      lastName: 'Khan',
      shippingPhone: '03334934403',
      streetAddress: 'Street 4, Phase 6',
      city: 'Lahore',
      province: 'Punjab',
      zoneId: 'lahore-dha',
      paymentMethod: 'qr_transfer',
      transactionId: 'TXN-554433',
      hasPaymentReceipt: false,
    },
    summary,
    DEFAULT_BUSINESS_SETTINGS
  );
  assert.equal(Object.keys(validTxnErrors).length, 0);

  // Providing Receipt without Transaction ID also passes
  const validReceiptErrors = validateCheckoutInput(
    {
      fullName: 'Ali Khan',
      email: 'ali@example.com',
      phone: '03334934403',
      firstName: 'Ali',
      lastName: 'Khan',
      shippingPhone: '03334934403',
      streetAddress: 'Street 4, Phase 6',
      city: 'Lahore',
      province: 'Punjab',
      zoneId: 'lahore-dha',
      paymentMethod: 'qr_transfer',
      transactionId: '',
      hasPaymentReceipt: true,
    },
    summary,
    DEFAULT_BUSINESS_SETTINGS
  );
  assert.equal(Object.keys(validReceiptErrors).length, 0);

  // Quote validation
  const quoteErrors = validateWholesaleQuoteInput({
    businessName: 'Cafe',
    contactName: '',
    businessType: '',
    phone: '0300',
    email: '',
    deliveryAddress: '',
    items: [],
  });
  assert.ok(quoteErrors.contactName);
  assert.ok(quoteErrors.items);
});
