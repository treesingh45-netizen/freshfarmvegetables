import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FileImage,
  Loader2,
  Lock,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { ProduceImage } from '../components/ProduceImage';
import { useStore } from '../context/StoreContext';
import { PaymentMethod } from '../types';
import {
  calculateCartSummary,
  formatPkr,
  normalizeDigitsPhone,
  validateCheckoutInput,
} from '../utils/commerce';

const MAX_RECEIPT_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

export function CheckoutPage() {
  const {
    products,
    settings,
    user,
    authToken,
    cartItems,
    selectedZoneId,
    setSelectedZoneId,
    clearCart,
    confirmUpdatedCartPrices,
    refreshStore,
    navigate,
  } = useStore();

  useEffect(() => {
    document.title = 'Secure Checkout — Fresh Farm Vegetables';
  }, []);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [marketingConsent, setMarketingConsent] = useState(false);

  const defaultAddr = user?.savedAddresses?.[0];
  const [country] = useState('Pakistan');
  const [firstName, setFirstName] = useState(
    defaultAddr?.firstName || (user?.fullName ? user.fullName.split(' ')[0] : '')
  );
  const [lastName, setLastName] = useState(
    defaultAddr?.lastName ||
      (user?.fullName ? user.fullName.split(' ').slice(1).join(' ') : '')
  );
  const [shippingPhone, setShippingPhone] = useState(defaultAddr?.phone || user?.phone || '');
  const [streetAddress, setStreetAddress] = useState(defaultAddr?.streetAddress || '');
  const [apartment, setApartment] = useState(defaultAddr?.apartment || '');
  const [city, setCity] = useState(defaultAddr?.city || 'Lahore');
  const [province, setProvince] = useState(defaultAddr?.province || 'Punjab');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || '');
  const [zoneId, setZoneId] = useState(defaultAddr?.zoneId || selectedZoneId || 'lahore-dha');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(() =>
    settings.qrPaymentEnabled ? 'qr_transfer' : settings.codEnabled ? 'cod' : ''
  );

  // Payment Proof state for QR / Official Account Transfer
  const [transactionId, setTransactionId] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [copiedField, setCopiedField] = useState<string>('');
  const [enlargeQr, setEnlargeQr] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const summary = useMemo(
    () => calculateCartSummary(cartItems, products, settings, zoneId),
    [cartItems, products, settings, zoneId]
  );

  const activeZone = useMemo(
    () => settings.deliveryZones.find((z) => z.id === zoneId && z.enabled),
    [settings.deliveryZones, zoneId]
  );

  const codAvailable = Boolean(settings.codEnabled && activeZone?.codEnabled);
  const payableTotalPkr = summary.grandTotalPkr ?? summary.subtotalPkr ?? 0;

  useEffect(() => {
    if (paymentMethod === 'cod' && !codAvailable) {
      if (settings.qrPaymentEnabled) {
        setPaymentMethod('qr_transfer');
      } else if (settings.onlineCardEnabled) {
        setPaymentMethod('online_card');
      } else {
        setPaymentMethod('');
      }
    } else if (paymentMethod === 'qr_transfer' && !settings.qrPaymentEnabled) {
      setPaymentMethod(codAvailable ? 'cod' : '');
    } else if (!paymentMethod) {
      if (settings.qrPaymentEnabled) setPaymentMethod('qr_transfer');
      else if (codAvailable) setPaymentMethod('cod');
    }
  }, [codAvailable, paymentMethod, settings.onlineCardEnabled, settings.qrPaymentEnabled]);

  const handleCopyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(''), 2000);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  const handleApplySavedAddress = (addrId: string) => {
    const found = user?.savedAddresses.find((a) => a.id === addrId);
    if (!found) return;
    setFirstName(found.firstName);
    setLastName(found.lastName);
    setShippingPhone(found.phone);
    setStreetAddress(found.streetAddress);
    setApartment(found.apartment);
    setCity(found.city);
    setProvince(found.province);
    setPostalCode(found.postalCode);
    setZoneId(found.zoneId);
    setSelectedZoneId(found.zoneId);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceiptError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setReceiptError('Please upload a PNG, JPG, or WEBP payment receipt image.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_RECEIPT_SIZE_BYTES) {
      setReceiptError('Payment receipt image must be 3 MB or smaller.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptDataUrl(reader.result);
        setReceiptFileName(file.name);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.paymentProof;
          return next;
        });
      }
    };
    reader.onerror = () => {
      setReceiptError('Unable to read the selected image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptDataUrl('');
    setReceiptFileName('');
    setReceiptError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validation = validateCheckoutInput(
      {
        fullName,
        email,
        phone,
        firstName,
        lastName,
        shippingPhone,
        streetAddress,
        city,
        province,
        zoneId,
        paymentMethod,
        transactionId,
        hasPaymentReceipt: Boolean(receiptDataUrl),
      },
      summary,
      settings
    );

    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      const firstMessage = Object.values(validation)[0];
      setServerError(firstMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cartItems,
          contact: { fullName, email, phone, marketingConsent },
          shippingAddress: {
            country,
            firstName,
            lastName,
            phone: shippingPhone,
            streetAddress,
            apartment,
            city,
            province,
            postalCode,
            zoneId,
            deliveryInstructions,
          },
          paymentMethod,
          paymentProof:
            paymentMethod === 'qr_transfer'
              ? {
                  transactionId: transactionId.trim(),
                  senderInfo: senderInfo.trim(),
                  receiptDataUrl,
                  receiptFileName,
                }
              : undefined,
          saveAddressToAccount: Boolean(user && saveAddressToAccount),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.validationErrors) setErrors(data.validationErrors);
        await refreshStore();
        throw new Error(data.error || 'Could not place order. Please review your details.');
      }

      clearCart();
      const tokenParam = data.order.accessToken
        ? `token=${encodeURIComponent(data.order.accessToken)}&`
        : '';
      navigate(
        `/order-confirmation/${encodeURIComponent(
          data.order.reference
        )}?${tokenParam}email=${encodeURIComponent(data.order.contact.email)}`
      );
    } catch (err: any) {
      setServerError(err.message || 'Unable to submit order.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const waSupportDigits = normalizeDigitsPhone(settings.whatsappIntl || '+923334934403');
  const waPaymentHelpUrl = `https://wa.me/${waSupportDigits}?text=${encodeURIComponent(
    `Hello Fresh Farm Vegetables, I am checking out an order worth ${formatPkr(
      payableTotalPkr
    )} and would like to confirm your QR / payment transfer details.`
  )}`;

  if (summary.distinctCount === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-[#DCE8DC] p-10 space-y-4">
          <h1 className="text-2xl font-bold text-[#18261B]">Your cart is empty</h1>
          <p className="text-sm text-[#5A6B5D]">
            Add fresh vegetables from our catalog before proceeding to checkout.
          </p>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="h-11 px-6 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold transition-colors"
          >
            Return to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F5338] hover:text-[#12B326] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shopping Cart</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18261B] tracking-tight">
            Secure Checkout
          </h1>
          <p className="text-sm text-[#5A6B5D] mt-1">
            Complete your Lahore delivery details, review your PKR order total, and confirm payment.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC] text-xs font-semibold text-[#0F5338]">
          <ShieldCheck className="w-4 h-4 text-[#12B326]" />
          <span>Verified Order &amp; Payment Protection</span>
        </div>
      </div>

      {/* Block checkout if unpriced items are present */}
      {summary.hasUnpricedItems ? (
        <div className="bg-white rounded-3xl border border-[#DCE8DC] p-8 max-w-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-[#0F5338] shrink-0 mt-0.5" />
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#18261B]">
                Price Confirmation Required Before Final Checkout
              </h2>
              <p className="text-sm text-[#5A6B5D] leading-relaxed">
                Your cart includes vegetables marked &quot;Request Today&apos;s Rate.&quot; Submit a quote inquiry now and our team will share confirmed PKR rates promptly.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/wholesale?from=cart')}
                  className="h-11 px-6 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold"
                >
                  Request Confirmed Prices
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="h-11 px-5 rounded-2xl border border-[#DCE8DC] text-sm font-semibold text-[#18261B]"
                >
                  Review Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Contact, Delivery Address, Service Zone, Secure Payment */}
          <div className="lg:col-span-7 space-y-6">
            {serverError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-[#FFF5F5] border border-[#E4483D]/35 flex items-start gap-2.5 text-sm text-[#C62F24] font-medium"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#E4483D]" />
                <span>{serverError}</span>
              </div>
            )}

            {summary.hasPriceChanges && (
              <div className="p-4 rounded-2xl bg-[#FFF5F5] border border-[#E4483D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-[#202820]">
                  Daily product rates changed since you added items to cart. Please approve the updated PKR total before placing your order.
                </p>
                <button
                  type="button"
                  onClick={confirmUpdatedCartPrices}
                  className="h-9 px-4 rounded-xl bg-[#0F5338] text-white text-xs font-semibold shrink-0"
                >
                  Approve Updated Prices
                </button>
              </div>
            )}

            {/* 1. Contact Information */}
            <section className="bg-white rounded-3xl border border-[#DCE8DC] p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[#18261B]">1. Contact Information</h2>
                {!user && (
                  <button
                    type="button"
                    onClick={() => navigate('/account')}
                    className="text-xs font-semibold text-[#12B326] hover:underline"
                  >
                    Have an account? Sign in
                  </button>
                )}
              </div>
              <p className="text-xs text-[#5A6B5D]">
                Used strictly for order confirmation, payment verification updates, and Lahore dispatch coordination.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="chk-fullname"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Full Name *
                  </label>
                  <input
                    id="chk-fullname"
                    type="text"
                    placeholder="e.g., Bilal Ahmed"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (!firstName && e.target.value.includes(' ')) {
                        const parts = e.target.value.trim().split(/\s+/);
                        setFirstName(parts[0] || '');
                        setLastName(parts.slice(1).join(' ') || '');
                      }
                    }}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-[#E4483D] mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="chk-email"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Email Address *
                  </label>
                  <input
                    id="chk-email"
                    type="email"
                    placeholder="customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                  {errors.email && <p className="text-xs text-[#E4483D] mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label
                    htmlFor="chk-phone"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Phone or WhatsApp Number *
                  </label>
                  <input
                    id="chk-phone"
                    type="tel"
                    placeholder="0300-1234567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (!shippingPhone) setShippingPhone(e.target.value);
                    }}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                  {errors.phone && <p className="text-xs text-[#E4483D] mt-1">{errors.phone}</p>}
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[#5A6B5D] cursor-pointer leading-relaxed">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 shrink-0 rounded border-[#DCE8DC] text-[#12B326] accent-[#12B326]"
                />
                <span>Send me seasonal produce availability updates and wholesale rate notices.</span>
              </label>
            </section>

            {/* 2. Delivery Address */}
            <section className="bg-white rounded-3xl border border-[#DCE8DC] p-6 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[#18261B]">2. Delivery Address</h2>
                {user && user.savedAddresses.length > 0 && (
                  <select
                    aria-label="Choose a saved address"
                    onChange={(e) => handleApplySavedAddress(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-xs font-medium"
                  >
                    <option value="">Use saved address...</option>
                    {user.savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} — {a.streetAddress}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="chk-country"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Country
                  </label>
                  <input
                    id="chk-country"
                    type="text"
                    value={country}
                    readOnly
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm text-[#5A6B5D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="chk-zone"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Delivery Area / Service Zone *
                  </label>
                  <select
                    id="chk-zone"
                    value={zoneId}
                    onChange={(e) => {
                      setZoneId(e.target.value);
                      setSelectedZoneId(e.target.value);
                    }}
                    className="w-full h-11 px-3 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  >
                    {settings.deliveryZones
                      .filter((z) => z.enabled)
                      .map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}{' '}
                          {z.deliveryFeePkr !== null
                            ? `(${formatPkr(z.deliveryFeePkr)})`
                            : '(Fee confirmed by team)'}
                        </option>
                      ))}
                  </select>
                  {errors.zoneId && <p className="text-xs text-[#E4483D] mt-1">{errors.zoneId}</p>}
                </div>

                <div>
                  <label
                    htmlFor="chk-fname"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Recipient First Name *
                  </label>
                  <input
                    id="chk-fname"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-[#E4483D] mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="chk-lname"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Recipient Last Name *
                  </label>
                  <input
                    id="chk-lname"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-[#E4483D] mt-1">{errors.lastName}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="chk-ship-phone"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Receiving Phone Number *
                  </label>
                  <input
                    id="chk-ship-phone"
                    type="tel"
                    placeholder="0300-1234567"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                  {errors.shippingPhone && (
                    <p className="text-xs text-[#E4483D] mt-1">{errors.shippingPhone}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="chk-street"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    House / Plot &amp; Street Address *
                  </label>
                  <input
                    id="chk-street"
                    type="text"
                    placeholder="e.g., House 42, Street 8, Phase 6, DHA"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                  {errors.streetAddress && (
                    <p className="text-xs text-[#E4483D] mt-1">{errors.streetAddress}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="chk-apt"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Apartment, Floor, or Kitchen Receiving Bay (Optional)
                  </label>
                  <input
                    id="chk-apt"
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="chk-city"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    City *
                  </label>
                  <input
                    id="chk-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                  {errors.city && <p className="text-xs text-[#E4483D] mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label
                    htmlFor="chk-province"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Province *
                  </label>
                  <input
                    id="chk-province"
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                  {errors.province && (
                    <p className="text-xs text-[#E4483D] mt-1">{errors.province}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="chk-postal"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Postal Code (Optional)
                  </label>
                  <input
                    id="chk-postal"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="chk-notes"
                    className="block text-xs font-semibold text-[#18261B] mb-1"
                  >
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    id="chk-notes"
                    rows={2}
                    placeholder="Gate entry note, preferred receiving contact, or packaging request..."
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                  />
                </div>
              </div>

              {user && (
                <label className="flex items-start gap-2.5 text-xs text-[#18261B] cursor-pointer leading-relaxed">
                  <input
                    type="checkbox"
                    checked={saveAddressToAccount}
                    onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                    className="mt-0.5 shrink-0 rounded border-[#DCE8DC] text-[#12B326] accent-[#12B326]"
                  />
                  <span>Save this delivery address to my account</span>
                </label>
              )}
            </section>

            {/* 3. Secure Payment Integration (QR Code, Official Payment Link & COD) */}
            <section className="bg-white rounded-3xl border border-[#DCE8DC] p-6 space-y-5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[#18261B]">
                    3. Secure Payment &amp; Verification
                  </h2>
                  <p className="text-xs text-[#5A6B5D] mt-0.5">
                    Choose QR / Official Account Transfer or Cash on Delivery. Online payments are verified before orders are marked Paid.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Option 1: QR Code & Official Payment Link */}
                {settings.qrPaymentEnabled && (
                  <div
                    className={`rounded-2xl border transition-colors ${
                      paymentMethod === 'qr_transfer'
                        ? 'border-[#12B326] bg-[#F4FAF5]/70'
                        : 'border-[#DCE8DC] bg-white'
                    }`}
                  >
                    <label className="flex items-start gap-3 p-4 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'qr_transfer'}
                        onChange={() => setPaymentMethod('qr_transfer')}
                        className="mt-1 text-[#12B326] accent-[#12B326]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#18261B]">
                            {settings.paymentProviderTitle ||
                              'QR Code & Official Account Transfer'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#12B326]/15 text-[#0F5338] text-[11px] font-semibold">
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Instant QR / Bank / Wallet</span>
                          </span>
                        </div>
                        <p className="text-xs text-[#5A6B5D] mt-0.5">
                          Scan the official QR code or open our payment link, transfer the PKR total, and submit your Transaction ID or receipt below.
                        </p>
                      </div>
                    </label>

                    {paymentMethod === 'qr_transfer' && (
                      <div className="px-4 pb-5 pt-2 border-t border-[#DCE8DC] space-y-5">
                        {/* Exact PKR Payable Banner */}
                        <div className="p-4 rounded-2xl bg-[#0F5338] text-white flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">
                              Exact Order Total to Pay
                            </p>
                            <p className="text-xl sm:text-2xl font-mono font-bold tabular-nums mt-0.5">
                              {formatPkr(payableTotalPkr)}
                            </p>
                            {summary.deliveryPendingConfirmation && (
                              <p className="text-[11px] text-white/80 mt-0.5">
                                Produce subtotal shown; custom zone delivery fee confirmed by team.
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText('amount', String(Math.round(payableTotalPkr)))}
                            className="h-9 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            {copiedField === 'amount' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied Amount</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy PKR Amount</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* QR Code + Official Link + Account Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                          {/* QR Code Display Card */}
                          <div className="md:col-span-5 bg-white rounded-2xl border border-[#DCE8DC] p-4 flex flex-col items-center justify-center text-center">
                            {settings.paymentQrImageUrl ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEnlargeQr(true)}
                                  className="group focus:outline-none"
                                  aria-label="Enlarge payment QR code"
                                >
                                  <img
                                    src={settings.paymentQrImageUrl}
                                    alt="Fresh Farm Vegetables Official Payment QR Code"
                                    className="w-44 h-44 object-contain rounded-xl border border-[#E4ECE4] p-2 bg-white mx-auto group-hover:border-[#12B326] transition-colors"
                                  />
                                </button>
                                <p className="text-xs font-semibold text-[#0F5338] mt-2.5">
                                  Scan with Banking or Mobile Wallet App
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setEnlargeQr(true)}
                                  className="text-[11px] font-semibold text-[#12B326] hover:underline mt-0.5"
                                >
                                  Click QR to enlarge
                                </button>
                              </>
                            ) : (
                              <div className="py-3 px-2 flex flex-col items-center">
                                <div className="w-28 h-28 rounded-2xl bg-[#F4FAF5] border-2 border-dashed border-[#B7D7B9] flex flex-col items-center justify-center text-[#0F5338] mb-3">
                                  <QrCode className="w-11 h-11 text-[#12B326]" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
                                    Merchant QR
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-[#18261B]">
                                  Official QR Code Slot Ready
                                </p>
                                <p className="text-[11px] text-[#5A6B5D] mt-1 leading-relaxed">
                                  Upload your official QR code in Admin Settings to display it here, or request instant transfer details on WhatsApp below.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Instructions & Official Payment Link / Account Details */}
                          <div className="md:col-span-7 bg-white rounded-2xl border border-[#DCE8DC] p-4 flex flex-col justify-between space-y-3.5">
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5338]">
                                  How to Complete Payment
                                </h3>
                                <span className="text-[11px] font-semibold text-[#5A6B5D]">
                                  {settings.paymentAccountTitle || 'Fresh Farm Vegetables'}
                                </span>
                              </div>

                              <ol className="space-y-2 text-xs text-[#2B3A2E] leading-relaxed list-decimal list-outside pl-4">
                                <li>
                                  Scan the QR code or open the official payment link to send{' '}
                                  <strong className="font-mono text-[#0F5338]">
                                    {formatPkr(payableTotalPkr)}
                                  </strong>
                                  .
                                </li>
                                <li>
                                  Save a screenshot of your transfer confirmation or copy the{' '}
                                  <strong>Transaction / Reference ID</strong>.
                                </li>
                                <li>
                                  Enter the Transaction ID or upload your receipt below, then click{' '}
                                  <strong>Place Order</strong>.
                                </li>
                              </ol>

                              {settings.paymentInstructions && (
                                <p className="text-[11px] text-[#5A6B5D] bg-[#F4FAF5] p-2.5 rounded-xl border border-[#E4ECE4]">
                                  {settings.paymentInstructions}
                                </p>
                              )}

                              {(settings.paymentBankOrWalletName ||
                                settings.paymentAccountNumber) && (
                                <div className="p-3 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] space-y-1 text-xs">
                                  {settings.paymentBankOrWalletName && (
                                    <div className="flex justify-between gap-2">
                                      <span className="text-[#5A6B5D]">Bank / Wallet:</span>
                                      <span className="font-semibold text-[#18261B]">
                                        {settings.paymentBankOrWalletName}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between gap-2">
                                    <span className="text-[#5A6B5D]">Account Title:</span>
                                    <span className="font-semibold text-[#18261B]">
                                      {settings.paymentAccountTitle || 'Fresh Farm Vegetables'}
                                    </span>
                                  </div>
                                  {settings.paymentAccountNumber && (
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#DCE8DC]">
                                      <span className="font-mono font-bold text-[#0F5338] break-all">
                                        {settings.paymentAccountNumber}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCopyText('account', settings.paymentAccountNumber)
                                        }
                                        className="h-7 px-2.5 rounded-lg bg-white border border-[#DCE8DC] text-[11px] font-semibold text-[#0F5338] hover:border-[#12B326] inline-flex items-center gap-1 shrink-0"
                                      >
                                        {copiedField === 'account' ? (
                                          <>
                                            <Check className="w-3 h-3" />
                                            <span>Copied</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {settings.paymentLinkUrl ? (
                                <a
                                  href={settings.paymentLinkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 min-w-[180px] h-10 px-4 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <span>Open Official Payment Link</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <a
                                  href={waPaymentHelpUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 min-w-[180px] h-9 px-3.5 rounded-xl border border-[#0F5338] text-[#0F5338] hover:bg-[#0F5338] hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Request Payment Link on WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment Proof Submission Inputs */}
                        <div className="bg-white rounded-2xl border border-[#DCE8DC] p-4 sm:p-5 space-y-4">
                          <div>
                            <h3 className="text-sm font-bold text-[#18261B]">
                              Submit Payment Confirmation Proof *
                            </h3>
                            <p className="text-xs text-[#5A6B5D] mt-0.5">
                              Provide your bank/wallet Transaction ID or upload a screenshot of your payment receipt. At least one is required.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="chk-txn-id"
                                className="block text-xs font-semibold text-[#18261B] mb-1"
                              >
                                Payment Transaction / Reference ID
                              </label>
                              <input
                                id="chk-txn-id"
                                type="text"
                                placeholder="e.g., TXN-94820155 or RAAST Ref"
                                value={transactionId}
                                onChange={(e) => {
                                  setTransactionId(e.target.value);
                                  if (e.target.value.trim().length >= 4) {
                                    setErrors((prev) => {
                                      const next = { ...prev };
                                      delete next.paymentProof;
                                      return next;
                                    });
                                  }
                                }}
                                className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm font-mono focus:bg-white focus:border-[#12B326] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="chk-sender-info"
                                className="block text-xs font-semibold text-[#18261B] mb-1"
                              >
                                Sender Account Title / Last 4 Digits (Optional)
                              </label>
                              <input
                                id="chk-sender-info"
                                type="text"
                                placeholder="e.g., Bilal Ahmed - 4412"
                                value={senderInfo}
                                onChange={(e) => setSenderInfo(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Receipt Image Upload */}
                          <div>
                            <span className="block text-xs font-semibold text-[#18261B] mb-1.5">
                              Upload Payment Receipt Screenshot (PNG, JPG, WEBP — max 3 MB)
                            </span>

                            {!receiptDataUrl ? (
                              <label
                                htmlFor="chk-receipt-upload"
                                className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border-2 border-dashed border-[#C5DEC7] bg-[#F4FAF5]/60 hover:bg-[#F4FAF5] hover:border-[#12B326] cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-3 text-left">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-[#DCE8DC] text-[#0F5338] flex items-center justify-center shrink-0">
                                    <Upload className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-[#18261B]">
                                      Choose payment receipt image
                                    </p>
                                    <p className="text-[11px] text-[#5A6B5D]">
                                      Attach screenshot from banking app, Raast, JazzCash, or Easypaisa
                                    </p>
                                  </div>
                                </div>
                                <span className="h-9 px-3.5 rounded-xl bg-white border border-[#DCE8DC] text-xs font-semibold text-[#0F5338] inline-flex items-center shrink-0">
                                  Browse File
                                </span>
                                <input
                                  id="chk-receipt-upload"
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  onChange={handleReceiptUpload}
                                  className="sr-only"
                                />
                              </label>
                            ) : (
                              <div className="p-3.5 rounded-2xl bg-[#F4FAF5] border border-[#12B326]/40 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={receiptDataUrl}
                                    alt="Uploaded payment receipt preview"
                                    className="w-14 h-14 rounded-xl object-cover bg-white border border-[#DCE8DC] shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-[#0F5338] flex items-center gap-1.5">
                                      <FileImage className="w-3.5 h-3.5 text-[#12B326] shrink-0" />
                                      <span className="truncate">
                                        {receiptFileName || 'Payment receipt attached'}
                                      </span>
                                    </p>
                                    <p className="text-[11px] text-[#5A6B5D] mt-0.5">
                                      Receipt attached for administrator verification
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleRemoveReceipt}
                                  aria-label="Remove uploaded payment receipt"
                                  className="h-8 px-2.5 rounded-lg bg-white border border-[#DCE8DC] text-xs font-semibold text-[#E4483D] hover:bg-[#FFF5F5] inline-flex items-center gap-1 shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            )}

                            {receiptError && (
                              <p className="text-xs text-[#E4483D] mt-1.5">{receiptError}</p>
                            )}
                            {errors.paymentProof && (
                              <p className="text-xs font-medium text-[#E4483D] mt-1.5">
                                {errors.paymentProof}
                              </p>
                            )}
                          </div>

                          <div className="p-3 rounded-xl bg-[#F4FAF5] border border-[#DCE8DC] flex items-start gap-2 text-[11px] text-[#0F5338] leading-relaxed">
                            <Lock className="w-3.5 h-3.5 text-[#12B326] shrink-0 mt-0.5" />
                            <span>
                              <strong>Verification Policy:</strong> Submitting a Transaction ID or receipt records your order as{' '}
                              <strong>Payment Verification Pending</strong>. Your order is marked as{' '}
                              <strong>Paid</strong> only after our team verifies the transfer against our account.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Option 2: Cash on Delivery (COD) */}
                {codAvailable ? (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                      paymentMethod === 'cod'
                        ? 'border-[#12B326] bg-[#F4FAF5]/70'
                        : 'border-[#DCE8DC] bg-white hover:border-[#C5DEC7]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 text-[#12B326] accent-[#12B326]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#18261B]">Cash on Delivery (COD)</p>
                      <p className="text-xs text-[#5A6B5D] mt-0.5">
                        Pay in PKR cash upon verified produce delivery at your Lahore address.
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC] text-xs text-[#5A6B5D]">
                    Cash on Delivery is available for confirmed Lahore service zones (DHA, Gulberg/Cantt, Model Town/Johar Town). For custom areas, use QR / Official Account Transfer above.
                  </div>
                )}

                {settings.onlineCardEnabled && (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer ${
                      paymentMethod === 'online_card'
                        ? 'border-[#12B326] bg-[#F4FAF5]/70'
                        : 'border-[#DCE8DC]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'online_card'}
                      onChange={() => setPaymentMethod('online_card')}
                      className="mt-1 text-[#12B326]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#18261B]">
                        Online Card Payment ({settings.onlineCardProviderName || 'Card Gateway'})
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {errors.paymentMethod && (
                <p className="text-xs text-[#E4483D]">{errors.paymentMethod}</p>
              )}
            </section>
          </div>

          {/* Right Column: Sticky Order Summary in PKR */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#DCE8DC] p-6 space-y-5 shadow-2xs lg:sticky lg:top-32">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#18261B]">Order Summary</h2>
              <span className="text-xs font-semibold text-[#0F5338] bg-[#F4FAF5] px-2.5 py-1 rounded-lg border border-[#DCE8DC]">
                {summary.totalItemCount} {summary.totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <ul className="divide-y divide-[#E4ECE4] max-h-80 overflow-y-auto pr-1">
              {summary.items.map((item) => (
                <li
                  key={`${item.productId}-${item.selectedPackage}`}
                  className="py-3 flex items-center gap-3"
                >
                  <ProduceImage
                    src={item.product?.imageUrl || ''}
                    alt={item.product?.name || 'Item'}
                    className="w-12 h-12 rounded-xl object-cover bg-[#F4FAF5] border border-[#DCE8DC] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#18261B] truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-[#5A6B5D] tabular-nums">
                      Qty: {item.quantity}{' '}
                      {item.selectedPackage ? `· ${item.selectedPackage}` : ''} ·{' '}
                      {item.unitPricePkr !== null ? formatPkr(item.unitPricePkr) : ''}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold text-[#18261B] tabular-nums">
                    {item.lineTotalPkr !== null ? formatPkr(item.lineTotalPkr) : '—'}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-[#DCE8DC] space-y-2.5 text-sm">
              <div className="flex justify-between text-[#5A6B5D]">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-[#18261B] tabular-nums">
                  {summary.subtotalPkr !== null ? formatPkr(summary.subtotalPkr) : '—'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 text-[#5A6B5D]">
                <span className="leading-snug">Delivery ({activeZone?.name || 'Lahore'})</span>
                <span className="font-mono text-xs sm:text-sm text-[#18261B] tabular-nums shrink-0">
                  {summary.deliveryPendingConfirmation
                    ? 'Confirmed by team'
                    : formatPkr(summary.deliveryFeePkr || 0)}
                </span>
              </div>
              {settings.taxRatePercent > 0 && (
                <div className="flex justify-between text-[#5A6B5D]">
                  <span>Applicable Taxes ({settings.taxRatePercent}%)</span>
                  <span className="font-mono tabular-nums">{formatPkr(summary.taxPkr || 0)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-[#DCE8DC] flex justify-between items-baseline">
                <span className="text-base font-bold text-[#18261B]">Order Total (PKR)</span>
                <span
                  data-testid="checkout-order-total"
                  className="text-xl font-mono font-bold text-[#0F5338] tabular-nums"
                >
                  {summary.grandTotalPkr !== null ? formatPkr(summary.grandTotalPkr) : '—'}
                </span>
              </div>
              {summary.deliveryPendingConfirmation && (
                <p className="text-[11px] text-[#5A6B5D]">
                  Custom area delivery charges will be confirmed by our dispatch team prior to delivery.
                </p>
              )}
            </div>

            {errors.cart && <p className="text-xs text-[#E4483D] font-medium">{errors.cart}</p>}

            <button
              type="submit"
              disabled={submitting || !summary.canProceedToCheckout || !paymentMethod}
              className="w-full h-12 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] disabled:bg-[#DCE8DC] disabled:text-[#687268] text-white text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                Place Order ({summary.grandTotalPkr !== null ? formatPkr(summary.grandTotalPkr) : 'Submit'})
              </span>
            </button>

            <p className="text-[11px] text-[#5A6B5D] text-center leading-relaxed">
              Order confirmation and WhatsApp notification details ({settings.whatsappIntl}) are generated immediately after submission.
            </p>
          </div>
        </form>
      )}

      {/* Enlarged QR Code Lightbox Modal */}
      {enlargeQr && settings.paymentQrImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Payment QR Code"
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
            <h3 className="text-base font-bold text-[#18261B]">
              Scan to Pay {formatPkr(payableTotalPkr)}
            </h3>
            <img
              src={settings.paymentQrImageUrl}
              alt="Enlarged Official Payment QR Code"
              className="w-64 h-64 object-contain mx-auto rounded-2xl border border-[#DCE8DC] p-2"
            />
            <p className="text-xs text-[#5A6B5D]">
              Account: {settings.paymentAccountTitle || 'Fresh Farm Vegetables'}
            </p>
            <button
              type="button"
              onClick={() => setEnlargeQr(false)}
              className="w-full h-10 rounded-xl bg-[#0F5338] text-white text-xs font-semibold"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
