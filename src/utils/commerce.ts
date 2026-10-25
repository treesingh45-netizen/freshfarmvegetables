import {
  BusinessSettings,
  CartItem,
  CartSummary,
  CatalogCategorySlug,
  EnrichedCartItem,
  Order,
  PaymentMethod,
  PaymentStatus,
  ProduceOrigin,
  Product,
} from '../types';

export interface ProductFilterOptions {
  searchQuery?: string;
  origin?: 'all' | ProduceOrigin;
  category?: CatalogCategorySlug;
  sortBy?: 'featured' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';
  inStockOnly?: boolean;
  includeDisabled?: boolean;
}

export function formatPkr(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}

export function formatRs(amount: number): string {
  return `Rs.${Math.round(amount).toLocaleString('en-PK')}`;
}

export function normalizeDigitsPhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function resolvePackageUnitPricePkr(
  product: Product | null | undefined,
  selectedPackage?: string
): number | null {
  if (
    !product ||
    product.pricingMode !== 'live' ||
    typeof product.pricePkr !== 'number' ||
    product.pricePkr <= 0
  ) {
    return null;
  }

  const basePrice = product.pricePkr;
  const unitLower = (product.priceUnit || 'per kg').toLowerCase();
  const pkgLower = (selectedPackage || '').trim().toLowerCase();

  if (!pkgLower || !unitLower.includes('kg')) {
    return Math.round(basePrice);
  }

  const kgMatch = pkgLower.match(/^(\d+(?:\.\d+)?)\s*kg$/);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    if (kg > 0) {
      return Math.max(10, Math.round(basePrice * kg));
    }
  }

  const gramMatch = pkgLower.match(/^(\d+(?:\.\d+)?)\s*g$/);
  if (gramMatch) {
    const grams = parseFloat(gramMatch[1]);
    if (grams > 0) {
      return Math.max(10, Math.round((basePrice * grams) / 1000));
    }
  }

  return Math.round(basePrice);
}

export function formatPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'pending_verification':
      return 'Payment Verification Pending';
    case 'cod_pending':
      return 'Cash on Delivery (Uncollected)';
    case 'paid':
      return 'Verified & Paid';
    case 'rejected':
      return 'Verification Declined — Action Needed';
    case 'refunded':
      return 'Refunded';
    case 'unpaid':
    default:
      return 'Unpaid';
  }
}

export function formatPaymentMethodLabel(
  method: PaymentMethod,
  settings?: Partial<BusinessSettings>
): string {
  switch (method) {
    case 'qr_transfer':
      return settings?.paymentProviderTitle || 'QR Code & Official Account Transfer';
    case 'online_card':
      return settings?.onlineCardProviderName
        ? `Online Card (${settings.onlineCardProviderName})`
        : 'Online Card Payment';
    case 'cod':
    default:
      return 'Cash on Delivery (COD)';
  }
}

export function filterAndSortProducts(
  products: Product[],
  options: ProductFilterOptions = {}
): Product[] {
  const {
    searchQuery = '',
    origin = 'all',
    category = 'all',
    sortBy = 'featured',
    inStockOnly = false,
    includeDisabled = false,
  } = options;

  const q = searchQuery.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (!includeDisabled && !p.enabled) return false;
    if (origin !== 'all' && p.origin !== origin) return false;
    if (category !== 'all' && !p.categories.includes(category)) return false;
    if (inStockOnly) {
      if (p.stockStatus !== 'in_stock' && p.stockStatus !== 'limited') {
        return false;
      }
    }
    if (q) {
      const haystack = `${p.name} ${p.origin} ${p.description} ${p.culinaryApplications}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    if (sortBy === 'price-asc') {
      const aPriced = a.pricingMode === 'live' && a.pricePkr !== null;
      const bPriced = b.pricingMode === 'live' && b.pricePkr !== null;
      if (aPriced && bPriced) return (a.pricePkr as number) - (b.pricePkr as number);
      if (aPriced && !bPriced) return -1;
      if (!aPriced && bPriced) return 1;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'price-desc') {
      const aPriced = a.pricingMode === 'live' && a.pricePkr !== null;
      const bPriced = b.pricingMode === 'live' && b.pricePkr !== null;
      if (aPriced && bPriced) return (b.pricePkr as number) - (a.pricePkr as number);
      if (aPriced && !bPriced) return -1;
      if (!aPriced && bPriced) return 1;
      return a.name.localeCompare(b.name);
    }
    if (a.isSpecialty !== b.isSpecialty) return a.isSpecialty ? -1 : 1;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.bestseller !== b.bestseller) return a.bestseller ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return sorted;
}

export function calculateCartSummary(
  cartItems: CartItem[],
  products: Product[],
  settings: BusinessSettings,
  selectedZoneId?: string
): CartSummary {
  const productMap = new Map(products.map((p) => [p.id, p]));

  const enriched: EnrichedCartItem[] = cartItems.map((item) => {
    const product = productMap.get(item.productId) || null;
    const isUnavailable =
      !product || !product.enabled || product.stockStatus === 'out_of_stock';

    const resolvedUnitPrice = !isUnavailable
      ? resolvePackageUnitPricePkr(product, item.selectedPackage)
      : null;

    const hasConfirmedPrice = typeof resolvedUnitPrice === 'number' && resolvedUnitPrice > 0;
    const unitPricePkr = hasConfirmedPrice ? resolvedUnitPrice : null;
    const isUnpriced = !isUnavailable && !hasConfirmedPrice;

    const priceChanged =
      !isUnavailable &&
      ((item.snapshotPricingMode === 'live' &&
        item.snapshotPricePkr !== null &&
        hasConfirmedPrice &&
        item.snapshotPricePkr !== unitPricePkr) ||
        (item.snapshotPricingMode === 'live' && !hasConfirmedPrice));

    const lineTotalPkr =
      !isUnavailable && unitPricePkr !== null ? unitPricePkr * item.quantity : null;

    return {
      productId: item.productId,
      product,
      quantity: item.quantity,
      selectedPackage: item.selectedPackage,
      unitPricePkr,
      lineTotalPkr,
      isUnpriced,
      isUnavailable,
      priceChanged,
      previousPricePkr: item.snapshotPricePkr,
    };
  });

  const totalItemCount = enriched.reduce((sum, i) => sum + i.quantity, 0);
  const distinctCount = enriched.length;
  const hasUnpricedItems = enriched.some((i) => i.isUnpriced);
  const hasUnavailableItems = enriched.some((i) => i.isUnavailable);
  const hasPriceChanges = enriched.some((i) => i.priceChanged);

  const canCalculateMonetaryTotals =
    distinctCount > 0 && !hasUnpricedItems && !hasUnavailableItems;

  const subtotalPkr = canCalculateMonetaryTotals
    ? enriched.reduce((sum, i) => sum + (i.lineTotalPkr || 0), 0)
    : null;

  const zone = selectedZoneId
    ? settings.deliveryZones.find((z) => z.id === selectedZoneId && z.enabled)
    : undefined;

  const deliveryFeePkr =
    canCalculateMonetaryTotals && zone && typeof zone.deliveryFeePkr === 'number'
      ? zone.deliveryFeePkr
      : null;

  const deliveryPendingConfirmation =
    !zone || zone.deliveryFeePkr === null || typeof zone.deliveryFeePkr !== 'number';

  const taxPkr =
    subtotalPkr !== null && settings.taxRatePercent > 0
      ? Math.round((subtotalPkr * settings.taxRatePercent) / 100)
      : subtotalPkr !== null
      ? 0
      : null;

  const grandTotalPkr =
    subtotalPkr !== null && !deliveryPendingConfirmation
      ? subtotalPkr + (deliveryFeePkr || 0) + (taxPkr || 0)
      : subtotalPkr !== null
      ? subtotalPkr + (taxPkr || 0)
      : null;

  const canProceedToCheckout =
    distinctCount > 0 &&
    !hasUnpricedItems &&
    !hasUnavailableItems &&
    !hasPriceChanges;

  return {
    items: enriched,
    totalItemCount,
    distinctCount,
    hasUnpricedItems,
    hasUnavailableItems,
    hasPriceChanges,
    canProceedToCheckout,
    subtotalPkr,
    deliveryFeePkr,
    deliveryPendingConfirmation,
    taxPkr,
    grandTotalPkr,
  };
}

export function buildProductWhatsAppUrl(
  whatsappIntl: string,
  productName: string,
  options?: {
    quantity?: number;
    selectedPackage?: string;
    deliveryLocation?: string;
  }
): string {
  const digits = normalizeDigitsPhone(whatsappIntl || '+923334934403');
  const qtyText =
    options?.quantity && options.quantity > 1 ? ` (Quantity: ${options.quantity})` : '';
  const pkgText = options?.selectedPackage ? ` [${options.selectedPackage}]` : '';
  const locText = options?.deliveryLocation
    ? ` Delivery area: ${options.deliveryLocation}.`
    : '';

  const message = `Hello Fresh Farm Vegetables, I would like today's rates and availability for ${productName}${pkgText}${qtyText}. Please share the available package sizes and ordering details.${locText}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildMultiItemWhatsAppUrl(
  whatsappIntl: string,
  items: { productName: string; quantity: number; selectedPackage?: string }[],
  context?: {
    businessName?: string;
    contactName?: string;
    deliveryArea?: string;
  }
): string {
  const digits = normalizeDigitsPhone(whatsappIntl || '+923334934403');
  const lines = items.map(
    (item, idx) =>
      `${idx + 1}. ${item.productName} - Qty: ${item.quantity}${
        item.selectedPackage ? ` (${item.selectedPackage})` : ''
      }`
  );

  const header = context?.businessName
    ? `Hello Fresh Farm Vegetables, I am contacting from ${context.businessName}${
        context.contactName ? ` (${context.contactName})` : ''
      }. Please share today's rates and availability for:`
    : `Hello Fresh Farm Vegetables, please share today's rates and availability for the following items:`;

  const footer = context?.deliveryArea
    ? `\nDelivery location: ${context.deliveryArea}`
    : '';

  const fullText = `${header}\n${lines.join('\n')}${footer}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(fullText)}`;
}

export function formatOrderWhatsAppMessage(
  order: Order,
  settings?: Partial<BusinessSettings>
): string {
  const paymentStatusText = formatPaymentStatusLabel(order.paymentStatus);
  const paymentMethodText = formatPaymentMethodLabel(order.paymentMethod, settings);
  const txnRef = order.paymentDetails?.transactionId?.trim()
    ? order.paymentDetails.transactionId.trim()
    : order.paymentMethod === 'cod'
    ? 'Cash on Delivery (Payable at delivery)'
    : 'Receipt uploaded for verification';
  const receiptStatus = order.paymentDetails?.receiptDataUrl
    ? `Receipt Uploaded (${order.paymentDetails.receiptFileName || 'Image attached in Admin'})`
    : 'No receipt file attached';

  const itemLines = order.items.map(
    (item, index) =>
      `${index + 1}. ${item.productName} (${item.selectedPackage}) x ${item.quantity} = ${formatPkr(
        item.lineTotalPkr
      )}`
  );

  const zoneIncludesCity =
    Boolean(order.shippingAddress.zoneName) &&
    Boolean(order.shippingAddress.city) &&
    order.shippingAddress.zoneName
      .toLowerCase()
      .includes(order.shippingAddress.city.trim().toLowerCase());

  const addressParts = [
    order.shippingAddress.streetAddress,
    order.shippingAddress.apartment,
    order.shippingAddress.zoneName,
    zoneIncludesCity ? '' : order.shippingAddress.city,
    order.shippingAddress.province,
  ]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(', ');

  const totalLine =
    order.grandTotalPkr !== null
      ? `${formatPkr(order.grandTotalPkr)} (Subtotal: ${formatPkr(order.subtotalPkr)}${
          order.deliveryFeePkr !== null
            ? `, Delivery: ${formatPkr(order.deliveryFeePkr)}`
            : ', Delivery: To be confirmed'
        })`
      : `${formatPkr(order.subtotalPkr)} + Delivery confirmation`;

  const lines = [
    'NEW ORDER NOTIFICATION - Fresh Farm Vegetables',
    `Order Number: ${order.reference}`,
    `Payment Status: ${paymentStatusText}`,
    '',
    'Customer Details:',
    `Name: ${order.contact.fullName}`,
    `Phone: ${order.contact.phone}`,
    order.shippingAddress.phone && order.shippingAddress.phone !== order.contact.phone
      ? `Receiving Phone: ${order.shippingAddress.phone}`
      : '',
    '',
    'Ordered Products:',
    ...itemLines,
    '',
    `Total Amount (PKR): ${totalLine}`,
    '',
    'Delivery Address:',
    addressParts,
    order.shippingAddress.deliveryInstructions
      ? `Delivery Notes: ${order.shippingAddress.deliveryInstructions}`
      : '',
    '',
    'Payment & Reference:',
    `Payment Method: ${paymentMethodText}`,
    `Transaction Reference: ${txnRef}`,
    order.paymentMethod === 'qr_transfer' ? `Receipt Status: ${receiptStatus}` : '',
  ].filter((line, idx, arr) => {
    if (line !== '') return true;
    return idx > 0 && arr[idx - 1] !== '';
  });

  return lines.join('\n');
}

export function buildOrderWhatsAppUrl(
  whatsappIntl: string,
  order: Order,
  settings?: Partial<BusinessSettings>
): string {
  const digits = normalizeDigitsPhone(whatsappIntl || '+923334934403');
  const message = formatOrderWhatsAppMessage(order, settings);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export interface CheckoutValidationInput {
  fullName: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  shippingPhone: string;
  streetAddress: string;
  city: string;
  province: string;
  zoneId: string;
  paymentMethod: PaymentMethod | '';
  transactionId?: string;
  hasPaymentReceipt?: boolean;
}

export function validateCheckoutInput(
  input: CheckoutValidationInput,
  summary: CartSummary,
  settings: BusinessSettings
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (summary.distinctCount === 0) {
    errors.cart = 'Your cart is empty.';
  } else if (summary.hasUnpricedItems) {
    errors.cart =
      'One or more items require price confirmation. Please submit a quote inquiry instead.';
  } else if (summary.hasUnavailableItems) {
    errors.cart = 'Please remove unavailable items before placing your order.';
  } else if (summary.hasPriceChanges) {
    errors.cart = 'Product prices were updated. Please review and confirm the updated rates.';
  }

  if (!input.fullName.trim()) errors.fullName = 'Full name is required.';
  if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = 'Enter a valid email address for order confirmation.';
  }
  if (normalizeDigitsPhone(input.phone).length < 10) {
    errors.phone = 'Enter a valid phone or WhatsApp number (at least 10 digits).';
  }
  if (!input.firstName.trim()) errors.firstName = 'First name is required.';
  if (!input.lastName.trim()) errors.lastName = 'Last name is required.';
  if (normalizeDigitsPhone(input.shippingPhone).length < 10) {
    errors.shippingPhone = 'Delivery contact number is required.';
  }
  if (!input.streetAddress.trim()) errors.streetAddress = 'Street address is required.';
  if (!input.city.trim()) errors.city = 'City is required.';
  if (!input.province.trim()) errors.province = 'Province is required.';

  const zone = settings.deliveryZones.find((z) => z.id === input.zoneId && z.enabled);
  if (!zone) {
    errors.zoneId = 'Select an active delivery zone served by Fresh Farm Vegetables.';
  }

  if (!input.paymentMethod) {
    errors.paymentMethod = 'Select an approved payment method.';
  } else if (input.paymentMethod === 'qr_transfer') {
    if (!settings.qrPaymentEnabled) {
      errors.paymentMethod = 'QR & online account transfer is currently disabled.';
    } else {
      const cleanTxn = (input.transactionId || '').trim();
      const hasValidTxn = cleanTxn.length >= 4;
      const hasReceipt = Boolean(input.hasPaymentReceipt);
      if (!hasValidTxn && !hasReceipt) {
        errors.paymentProof =
          'Enter your payment Transaction ID (min 4 characters) or upload a payment receipt image so our team can verify your payment.';
      }
    }
  } else if (input.paymentMethod === 'cod') {
    if (!settings.codEnabled || (zone && !zone.codEnabled)) {
      errors.paymentMethod = 'Cash on Delivery is not enabled for the selected service zone.';
    }
  } else if (input.paymentMethod === 'online_card') {
    if (!settings.onlineCardEnabled) {
      errors.paymentMethod = 'Online card payment is not currently configured.';
    }
  }

  return errors;
}

export interface WholesaleQuoteValidationInput {
  businessName: string;
  contactName: string;
  businessType: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  items: { productId: string; productName: string; quantity: number }[];
}

export function validateWholesaleQuoteInput(
  input: WholesaleQuoteValidationInput
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.contactName.trim()) {
    errors.contactName = 'Contact person name is required.';
  }
  if (!input.businessType.trim()) {
    errors.businessType = 'Select a customer or business type.';
  }
  if (normalizeDigitsPhone(input.phone).length < 10) {
    errors.phone = 'Enter a valid phone or WhatsApp number.';
  }
  if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!input.deliveryAddress.trim()) {
    errors.deliveryAddress = 'Delivery location or area in Lahore is required.';
  }
  const validItems = input.items.filter((i) => i.productName.trim() && i.quantity > 0);
  if (validItems.length === 0) {
    errors.items = 'Add at least one vegetable with a valid quantity.';
  }
  return errors;
}
