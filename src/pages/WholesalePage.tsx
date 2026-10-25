import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProcurementRecommendation, QuoteInquiry } from '../types';
import {
  buildMultiItemWhatsAppUrl,
  validateWholesaleQuoteInput,
} from '../utils/commerce';

interface FormItemRow {
  productId: string;
  productName: string;
  quantity: number;
  unitOrPackage: string;
}

const BUSINESS_TYPES = [
  'Restaurant',
  'Hotel',
  'Cafe',
  'Catering Company',
  'Commercial Kitchen',
  'Food-Service Business',
  'Individual / Household',
];

export function WholesalePage() {
  const {
    products,
    settings,
    user,
    authToken,
    cartSummary,
    clearCart,
    currentSearch,
    navigate,
  } = useStore();

  useEffect(() => {
    document.title = 'Business Supply & Wholesale Rates — Fresh Farm Vegetables Lahore';
  }, []);

  const enabledProducts = products.filter((p) => p.enabled);
  const fromCart = new URLSearchParams(currentSearch).get('from') === 'cart';

  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [businessType, setBusinessType] = useState('Restaurant');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.savedAddresses?.[0]
      ? `${user.savedAddresses[0].streetAddress}, ${user.savedAddresses[0].city}`
      : ''
  );
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');
  const [packagingRequirements, setPackagingRequirements] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [rows, setRows] = useState<FormItemRow[]>(() => {
    if (fromCart && cartSummary.items.length > 0) {
      return cartSummary.items.map((item) => ({
        productId: item.productId,
        productName: item.product?.name || '',
        quantity: item.quantity,
        unitOrPackage: item.selectedPackage || 'kg / standard',
      }));
    }
    return [
      {
        productId: 'prod-iceberg-lettuce',
        productName: 'Iceberg Lettuce',
        quantity: 10,
        unitOrPackage: 'kg / heads',
      },
      {
        productId: 'prod-vacuum-packed-lettuce',
        productName: 'Vacuum-Packed Lettuce',
        quantity: 5,
        unitOrPackage: 'vacuum packs',
      },
    ];
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedQuote, setSubmittedQuote] = useState<QuoteInquiry | null>(null);

  // Gemini High-Thinking Kitchen Menu Estimator state
  const [kitchenBrief, setKitchenBrief] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<ProcurementRecommendation[]>([]);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitchenBrief.trim()) {
      setAiError('Describe your menu dishes, daily covers, or banquet prep requirements first.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/procurement-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitchenBrief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate procurement plan.');
      setAiSummary(data.summary || '');
      setAiRecommendations(data.recommendations || []);
    } catch (err: any) {
      setAiError(err.message || 'Unable to generate kitchen plan right now.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyRecommendationsToForm = () => {
    if (aiRecommendations.length === 0) return;
    setRows(
      aiRecommendations.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        quantity: r.recommendedQuantity,
        unitOrPackage: r.unitSuggestion,
      }))
    );
    document.getElementById('wholesale-inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const found = enabledProducts.find((p) => p.id === prodId);
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === index
          ? {
              ...row,
              productId: prodId,
              productName: found ? found.name : row.productName,
            }
          : row
      )
    );
  };

  const addProductRow = () => {
    const first = enabledProducts[0];
    setRows((prev) => [
      ...prev,
      {
        productId: first?.id || '',
        productName: first?.name || '',
        quantity: 5,
        unitOrPackage: 'kg',
      },
    ]);
  };

  const removeProductRow = (index: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const validation = validateWholesaleQuoteInput({
      businessName,
      contactName,
      businessType,
      phone,
      email,
      deliveryAddress,
      items: rows,
    });

    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source: fromCart ? 'cart_inquiry' : 'wholesale_form',
          businessName,
          contactName,
          businessType,
          phone,
          email,
          deliveryAddress,
          preferredDeliveryDate,
          packagingRequirements,
          additionalNotes,
          items: rows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.validationErrors) setErrors(data.validationErrors);
        throw new Error(data.error || 'Could not submit inquiry.');
      }

      if (fromCart) {
        clearCart();
      }
      setSubmittedQuote(data.inquiry);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmitError(err.message || 'Unable to submit quote inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const directWhatsappUrl = buildMultiItemWhatsAppUrl(
    settings.whatsappIntl,
    rows
      .filter((r) => r.productName && r.quantity > 0)
      .map((r) => ({
        productName: r.productName,
        quantity: r.quantity,
        selectedPackage: r.unitOrPackage,
      })),
    {
      businessName: businessName || undefined,
      contactName: contactName || undefined,
      deliveryArea: deliveryAddress || undefined,
    }
  );

  if (submittedQuote) {
    const submittedWaUrl = buildMultiItemWhatsAppUrl(
      settings.whatsappIntl,
      submittedQuote.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        selectedPackage: i.unitOrPackage,
      })),
      {
        businessName: submittedQuote.businessName || submittedQuote.contactName,
        deliveryArea: submittedQuote.deliveryAddress,
      }
    );

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border border-[#E4EAE4] p-8 sm:p-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#12B326]/15 text-[#12B326] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F5338]">Inquiry Recorded</p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#202820]">
                Quote Request Submitted
              </h1>
              <p className="text-sm text-[#687268] mt-1">
                Reference:{' '}
                <strong className="font-mono text-[#202820]">{submittedQuote.reference}</strong>
              </p>
            </div>
          </div>

          <p className="text-sm text-[#687268] leading-relaxed">
            Our team at Commercial CCA, Phase 6, DHA, Lahore has logged your produce requirements and will respond with confirmed daily market rates and availability before finalizing your order.
          </p>

          <div className="p-4 rounded-2xl bg-[#F6F8F6] border border-[#E4EAE4]">
            <p className="text-xs font-sans font-bold text-[#202820] mb-2">Requested Produce</p>
            <ul className="space-y-1.5 text-sm">
              {submittedQuote.items.map((item, idx) => (
                <li key={idx} className="flex justify-between">
                  <span className="font-medium text-[#202820]">{item.productName}</span>
                  <span className="font-mono text-[#0F5338] tabular-nums">
                    {item.quantity} ({item.unitOrPackage})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={submittedWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-6 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Inquiry Directly on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="h-11 px-5 rounded-xl border border-[#E4EAE4] text-sm font-semibold text-[#202820] hover:border-[#12B326]"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Page Intro */}
      <div className="max-w-3xl">
        <p className="font-signature text-2xl sm:text-[1.8rem] text-[#12B326] py-0.5">
          Partnering with Professional Kitchens
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0F5338] mb-1">
          Business Supply &amp; Daily Rate Inquiries · Lahore
        </p>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.95rem] font-semibold text-[#202820] tracking-[-0.015em] leading-[1.1]">
          Business Supply &amp; Wholesale Rates
        </h1>
        <p className="text-sm sm:text-base text-[#687268] mt-2.5 leading-relaxed">
          Fresh Farm Vegetables supplies restaurants, hotels, cafés, catering kitchens, and households across Lahore. Submit your multi-product requirement list below or connect with us directly on WhatsApp ({settings.whatsappIntl}).
        </p>
      </div>

      {/* Commercial Kitchen Menu & Yield Estimator */}
      <section
        id="kitchen-planner"
        className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-8 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F2F7F3] border border-[#CFE3D2] text-[#0F5338] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="w-[22px] h-[22px]"
              >
                <rect
                  x="4"
                  y="2"
                  width="16"
                  height="20"
                  rx="3"
                  fill="#FFFFFF"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <rect
                  x="7.25"
                  y="5.25"
                  width="9.5"
                  height="4.25"
                  rx="1"
                  fill="currentColor"
                  fillOpacity="0.12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <rect x="7.25" y="12.5" width="2" height="2.25" rx="0.5" fill="currentColor" />
                <rect x="10.375" y="12.5" width="2" height="2.25" rx="0.5" fill="currentColor" />
                <rect x="7.25" y="16.25" width="2" height="2.25" rx="0.5" fill="currentColor" />
                <rect x="10.375" y="16.25" width="2" height="2.25" rx="0.5" fill="currentColor" />
                <rect x="13.5" y="12.5" width="3.25" height="6" rx="0.85" fill="#12B326" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#202820] leading-snug">
                Commercial Kitchen Menu &amp; Yield Estimator
              </h2>
              <p className="text-xs sm:text-[13px] text-[#687268] mt-0.5">
                Describe your menu items, guest covers, or prep schedule to calculate suggested quantities from our catalog.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setKitchenBrief(
                'Weekend service for 160 covers at a burger and continental bistro in DHA Lahore: 100 crispy chicken burgers with shredded iceberg, 45 Caesar salads, 50 pasta arrabbiata portions, and 35 grilled chicken mains with broccoli and herb butter.'
              )
            }
            className="text-xs font-semibold text-[#12B326] hover:underline self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            Load sample bistro service brief
          </button>
        </div>

        <form onSubmit={handleGeneratePlan} className="space-y-3">
          <textarea
            rows={4}
            value={kitchenBrief}
            onChange={(e) => setKitchenBrief(e.target.value)}
            placeholder="Example: Catering dinner for 250 guests plus daily cafe prep — burgers, Caesar salads, wood-fired pizza with basil and rocket, and roasted vegetable platters..."
            aria-label="Describe kitchen menu or event covers"
            className="w-full p-3.5 rounded-2xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm leading-relaxed text-[#202820] focus:bg-white focus:border-[#12B326] focus:outline-none"
          />
          {aiError && <p className="text-xs text-[#E4483D] font-medium">{aiError}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={aiLoading}
              className="h-10 px-5 rounded-xl bg-[#0F5338] hover:bg-[#003B22] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 transition-colors"
            >
              {aiLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{aiLoading ? 'Calculating Kitchen Yield...' : 'Calculate Produce Quantities'}</span>
            </button>
          </div>
        </form>

        {aiRecommendations.length > 0 && (
          <div className="pt-4 border-t border-[#E4EAE4] space-y-4">
            {aiSummary && <p className="text-sm text-[#202820] leading-relaxed">{aiSummary}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiRecommendations.map((rec) => (
                <div
                  key={rec.productId}
                  className="p-3.5 rounded-2xl bg-[#F6F8F6] border border-[#E4EAE4] flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-[#202820]">{rec.productName}</span>
                      <span className="text-xs font-mono font-bold text-[#12B326] tabular-nums">
                        {rec.recommendedQuantity} {rec.unitSuggestion}
                      </span>
                    </div>
                    <p className="text-xs text-[#687268] mt-1 leading-relaxed">
                      {rec.culinaryReasoning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={applyRecommendationsToForm}
              className="min-h-11 py-2.5 px-5 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs sm:text-sm font-semibold leading-snug transition-colors"
            >
              Populate Wholesale Inquiry Form with These Quantities
            </button>
          </div>
        )}
      </section>

      {/* Main Wholesale Inquiry Form */}
      <form
        id="wholesale-inquiry-form"
        onSubmit={handleSubmitQuote}
        noValidate
        className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-10 space-y-8"
      >
        <div>
          <p className="font-signature text-2xl text-[#12B326] py-0.5">
            Custom Multi-Item Quote
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#202820] leading-[1.15]">
            Business Supply &amp; Daily Rate Inquiry Form
          </h2>
          <p className="text-xs sm:text-sm text-[#687268] mt-1">
            Submit multiple vegetables in a single request. Our administrator responds with current PKR pricing before your order is finalized.
          </p>
        </div>

        {submitError && (
          <div className="p-4 rounded-2xl bg-[#FFF5F5] border border-[#E4483D]/30 text-sm text-[#E4483D]">
            {submitError}
          </div>
        )}

        {/* Business & Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label htmlFor="wh-biz" className="block text-xs font-semibold text-[#202820] mb-1.5">
              Business Name (Optional for Household)
            </label>
            <input
              id="wh-biz"
              type="text"
              placeholder="e.g., Cafe Aylanto / Hospitality Group"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="wh-contact" className="block text-xs font-semibold text-[#202820] mb-1.5">
              Contact Person's Name *
            </label>
            <input
              id="wh-contact"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
            />
            {errors.contactName && (
              <p className="text-xs text-[#E4483D] mt-1">{errors.contactName}</p>
            )}
          </div>

          <div>
            <label htmlFor="wh-type" className="block text-xs font-semibold text-[#202820] mb-1.5">
              Business / Customer Type *
            </label>
            <select
              id="wh-type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
            {errors.businessType && (
              <p className="text-xs text-[#E4483D] mt-1">{errors.businessType}</p>
            )}
          </div>

          <div>
            <label htmlFor="wh-phone" className="block text-xs font-semibold text-[#202820] mb-1.5">
              Phone / WhatsApp Number *
            </label>
            <input
              id="wh-phone"
              type="tel"
              placeholder="0333-4934403"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
            />
            {errors.phone && <p className="text-xs text-[#E4483D] mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="wh-email" className="block text-xs font-semibold text-[#202820] mb-1.5">
              Email Address
            </label>
            <input
              id="wh-email"
              type="email"
              placeholder="procurement@kitchen.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
            />
            {errors.email && <p className="text-xs text-[#E4483D] mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="wh-date" className="block text-xs font-semibold text-[#202820] mb-1.5">
              Preferred Delivery Date
            </label>
            <input
              id="wh-date"
              type="date"
              value={preferredDeliveryDate}
              onChange={(e) => setPreferredDeliveryDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
            />
          </div>
        </div>

        {/* Multi-Product Requirement Builder */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h3 className="text-base font-bold text-[#202820]">
              Products &amp; Quantities Required *
            </h3>
            <button
              type="button"
              onClick={addProductRow}
              className="h-9 px-3.5 rounded-xl border border-[#12B326] text-[#12B326] hover:bg-[#12B326] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Another Vegetable</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {rows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2.5 sm:gap-3 p-3 rounded-2xl bg-[#F6F8F6] border border-[#E4EAE4] items-center"
              >
                <div className="col-span-12 sm:col-span-5">
                  <label htmlFor={`row-prod-${index}`} className="sr-only">
                    Select vegetable
                  </label>
                  <select
                    id={`row-prod-${index}`}
                    value={row.productId}
                    onChange={(e) => handleProductSelect(index, e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#E4EAE4] text-sm text-[#202820]"
                  >
                    {enabledProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.origin === 'local' ? 'Local' : 'Imported'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label htmlFor={`row-qty-${index}`} className="sr-only">
                    Quantity
                  </label>
                  <input
                    id={`row-qty-${index}`}
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, quantity: Math.max(1, Number(e.target.value) || 1) } : r
                        )
                      )
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#E4EAE4] text-sm font-mono tabular-nums"
                  />
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor={`row-unit-${index}`} className="sr-only">
                    Unit or package preference
                  </label>
                  <input
                    id={`row-unit-${index}`}
                    type="text"
                    placeholder="kg / heads / vacuum packs"
                    value={row.unitOrPackage}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, unitOrPackage: e.target.value } : r))
                      )
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#E4EAE4] text-sm"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    disabled={rows.length <= 1}
                    onClick={() => removeProductRow(index)}
                    aria-label={`Remove row ${index + 1}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#687268] hover:text-[#E4483D] hover:bg-white disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {errors.items && <p className="text-xs text-[#E4483D]">{errors.items}</p>}
        </div>

        {/* Delivery, Packaging & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="wh-addr" className="block text-xs font-semibold text-[#202820] mb-1.5">
              Delivery Address in Lahore *
            </label>
            <input
              id="wh-addr"
              type="text"
              placeholder="Street, Commercial Area, Phase, Lahore"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
            />
            {errors.deliveryAddress && (
              <p className="text-xs text-[#E4483D] mt-1">{errors.deliveryAddress}</p>
            )}
          </div>

          <div>
            <label htmlFor="wh-pkg" className="block text-xs font-semibold text-[#202820] mb-1.5">
              Packaging Requirements
            </label>
            <input
              id="wh-pkg"
              type="text"
              placeholder="e.g., Vacuum-sealed packs, ventilated crates, sorted by size"
              value={packagingRequirements}
              onChange={(e) => setPackagingRequirements(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="wh-notes" className="block text-xs font-semibold text-[#202820] mb-1.5">
              Additional Notes / Recurring Schedule
            </label>
            <textarea
              id="wh-notes"
              rows={3}
              placeholder="Share kitchen receiving window, standing daily order frequency, or specification notes..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm focus:bg-white focus:border-[#12B326] focus:outline-none"
            />
          </div>
        </div>

        {/* Submission & WhatsApp Actions */}
        <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3.5">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 py-2.5 px-7 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            <span>Submit Quote Inquiry</span>
          </button>

          <a
            href={directWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-12 py-2.5 px-5 sm:px-6 rounded-xl border border-[#0F5338] text-[#0F5338] hover:bg-[#0F5338] hover:text-white text-xs sm:text-base font-semibold inline-flex items-center justify-center gap-2 text-center transition-colors"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Send List on WhatsApp ({settings.whatsappIntl})</span>
          </a>
        </div>
      </form>
    </div>
  );
}
