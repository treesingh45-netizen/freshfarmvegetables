export type ProduceOrigin = 'local' | 'imported';

export type CatalogCategorySlug =
  | 'all'
  | 'local'
  | 'imported'
  | 'iceberg-lettuce'
  | 'vacuum-packed-lettuce'
  | 'lettuce-collection'
  | 'bestsellers';

export type PricingMode = 'live' | 'quote';

export type StockStatus = 'unverified' | 'in_stock' | 'limited' | 'out_of_stock';

export interface Product {
  id: string;
  slug: string;
  name: string;
  origin: ProduceOrigin;
  categories: CatalogCategorySlug[];
  isSpecialty: boolean;
  featured: boolean;
  bestseller: boolean;
  description: string;
  culinaryApplications: string;
  handlingNotes: string;
  imageUrl: string;
  galleryUrls: string[];
  packageOptions: string[];
  pricingMode: PricingMode;
  pricePkr: number | null;
  priceUnit: string;
  priceUpdatedAt: string | null;
  stockStatus: StockStatus;
  enabled: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedPackage: string;
  snapshotPricePkr: number | null;
  snapshotPricingMode: PricingMode;
}

export interface EnrichedCartItem {
  productId: string;
  product: Product | null;
  quantity: number;
  selectedPackage: string;
  unitPricePkr: number | null;
  lineTotalPkr: number | null;
  isUnpriced: boolean;
  isUnavailable: boolean;
  priceChanged: boolean;
  previousPricePkr: number | null;
}

export interface CartSummary {
  items: EnrichedCartItem[];
  totalItemCount: number;
  distinctCount: number;
  hasUnpricedItems: boolean;
  hasUnavailableItems: boolean;
  hasPriceChanges: boolean;
  canProceedToCheckout: boolean;
  subtotalPkr: number | null;
  deliveryFeePkr: number | null;
  deliveryPendingConfirmation: boolean;
  taxPkr: number | null;
  grandTotalPkr: number | null;
}

export interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  enabled: boolean;
  deliveryFeePkr: number | null;
  codEnabled: boolean;
  notes: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phoneDisplay: string;
  whatsappIntl: string;
  email: string;
  emailVerified: boolean;
  instagramUrl: string;
  facebookUrl: string;
  businessHours: string;
  codEnabled: boolean;
  qrPaymentEnabled: boolean;
  paymentProviderTitle: string;
  paymentAccountTitle: string;
  paymentBankOrWalletName: string;
  paymentAccountNumber: string;
  paymentQrImageUrl: string;
  paymentLinkUrl: string;
  paymentInstructions: string;
  onlineCardEnabled: boolean;
  onlineCardProviderName: string;
  taxRatePercent: number;
  deliveryZones: DeliveryZone[];
  lastDailyRatesPublishedAt: string | null;
}

export type OrderStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'qr_transfer' | 'cod' | 'online_card';

export type PaymentStatus =
  | 'pending_verification'
  | 'cod_pending'
  | 'unpaid'
  | 'paid'
  | 'rejected'
  | 'refunded';

export interface OrderPaymentDetails {
  transactionId: string;
  receiptDataUrl: string;
  receiptFileName: string;
  senderInfo: string;
  submittedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationNote: string;
}

export interface WhatsAppNotificationRecord {
  configured: boolean;
  deliveredAutomatically: boolean;
  provider: 'meta_cloud_api' | 'webhook_provider' | 'manual_wa_link';
  recipientPhone: string;
  attemptedAt: string;
  prefilledUrl: string;
  statusMessage: string;
}

export interface OrderLineItem {
  productId: string;
  productName: string;
  origin: ProduceOrigin;
  quantity: number;
  selectedPackage: string;
  unitPricePkr: number;
  priceUnit: string;
  lineTotalPkr: number;
}

export interface Order {
  id: string;
  reference: string;
  accessToken?: string;
  customerId: string | null;
  contact: {
    fullName: string;
    email: string;
    phone: string;
    marketingConsent: boolean;
  };
  shippingAddress: {
    country: string;
    firstName: string;
    lastName: string;
    phone: string;
    streetAddress: string;
    apartment: string;
    city: string;
    province: string;
    postalCode: string;
    zoneId: string;
    zoneName: string;
    deliveryInstructions: string;
  };
  items: OrderLineItem[];
  subtotalPkr: number;
  deliveryFeePkr: number | null;
  deliveryNote: string;
  taxPkr: number;
  discountPkr: number;
  grandTotalPkr: number | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: OrderPaymentDetails;
  whatsappNotification?: WhatsAppNotificationRecord;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus =
  | 'new'
  | 'quoted'
  | 'approved_by_customer'
  | 'converted_to_order'
  | 'closed';

export interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  unitOrPackage: string;
  quotedUnitPricePkr?: number | null;
}

export interface QuoteInquiry {
  id: string;
  reference: string;
  customerId: string | null;
  source: 'wholesale_form' | 'cart_inquiry';
  businessName: string;
  contactName: string;
  businessType: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  preferredDeliveryDate: string;
  packagingRequirements: string;
  additionalNotes: string;
  items: QuoteItem[];
  status: QuoteStatus;
  adminResponseNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  streetAddress: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
  zoneId: string;
}

export interface UserPublic {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  role: 'customer' | 'admin';
  savedAddresses: SavedAddress[];
  favoriteProductIds: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface ProcurementRecommendation {
  productId: string;
  productName: string;
  recommendedQuantity: number;
  unitSuggestion: string;
  culinaryReasoning: string;
}
