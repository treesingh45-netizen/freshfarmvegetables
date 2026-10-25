import React, { useEffect } from 'react';
import { Building2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { normalizeDigitsPhone } from '../utils/commerce';

export function InfoPage({
  page,
}: {
  page: 'about' | 'contact' | 'order-info' | 'privacy' | 'terms' | 'delivery-policy';
}) {
  const { settings, navigate } = useStore();
  const digits = normalizeDigitsPhone(settings.whatsappIntl || '+923334934403');
  const officialEmail = settings.email || 'farmfreshvegetables@gmail.com';
  const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
    'Hello Fresh Farm Vegetables, I would like to connect regarding produce supply in Lahore.'
  )}`;

  useEffect(() => {
    const titles: Record<typeof page, string> = {
      about: 'About Us — Fresh Farm Vegetables Lahore',
      contact: 'Contact Us — Fresh Farm Vegetables Lahore',
      'order-info': 'Order & Pricing Information — Fresh Farm Vegetables',
      privacy: 'Privacy Policy — Fresh Farm Vegetables',
      terms: 'Terms and Conditions — Fresh Farm Vegetables',
      'delivery-policy': 'Delivery & Returns Policy — Fresh Farm Vegetables',
    };
    document.title = titles[page];
  }, [page]);

  if (page === 'contact') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold text-[#12B326] mb-1.5">
            Get in Touch
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#202820] tracking-tight leading-[1.16]">
            Contact Fresh Farm Vegetables
          </h1>
          <p className="text-sm sm:text-base text-[#687268] leading-relaxed mt-2">
            Connect with our Lahore supply team for daily vegetable rates, iceberg and vacuum-packed lettuce availability, and commercial kitchen accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 flex flex-col justify-between gap-4 h-full">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] text-[#12B326] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#202820] pt-1">Lahore Address</h2>
              <p className="text-sm text-[#687268] leading-relaxed">{settings.address}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 flex flex-col justify-between gap-4 h-full">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] text-[#12B326] flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#202820] pt-1">Phone &amp; WhatsApp</h2>
              <p className="text-sm font-mono font-semibold text-[#202820] tabular-nums">
                {settings.phoneDisplay}
              </p>
              <p className="text-xs text-[#687268] font-mono tabular-nums">
                International: {settings.whatsappIntl}
              </p>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#12B326] hover:text-[#0F5338] hover:underline transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Start WhatsApp Chat</span>
            </a>
          </div>

          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 flex flex-col justify-between gap-4 h-full">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] text-[#12B326] flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#202820] pt-1">Email Support</h2>
              <a
                href={`mailto:${officialEmail}`}
                className="block text-[13px] xl:text-sm font-semibold text-[#0F5338] hover:text-[#12B326] break-all transition-colors"
              >
                {officialEmail}
              </a>
              <p className="text-xs text-[#687268] leading-relaxed">
                For wholesale inquiries, account billing, and supplier correspondence.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 flex flex-col justify-between gap-4 h-full">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] text-[#12B326] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#202820] pt-1">
                Wholesale &amp; Kitchen Accounts
              </h2>
              <p className="text-sm text-[#687268] leading-relaxed">
                Submit your multi-item produce list online for restaurants, hotels, cafés, and catering kitchens.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/wholesale')}
              className="w-full h-10 px-4 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs font-semibold transition-colors"
            >
              Open Wholesale Inquiry Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-10 space-y-5">
        {page === 'about' && (
          <>
            <p className="text-xs sm:text-sm font-semibold text-[#12B326]">
              Fresh Farm Vegetables · Lahore
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#202820] tracking-tight leading-[1.18]">
              About Fresh Farm Vegetables
            </h1>
            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.75] max-w-3xl">
              Based in Commercial CCA, Phase 6, Defence Housing Authority (DHA), Lahore, Fresh Farm Vegetables supplies fresh local and imported vegetables to restaurants, hotels, cafés, catering companies, commercial kitchens, and individual customers.
            </p>
            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.75] max-w-3xl">
              Our primary house specialty centers on fresh iceberg lettuce and vacuum-packed lettuce, alongside a curated catalog of everyday local vegetables and specialty imported varieties such as romaine lettuce, lolo rose lettuce, rocket, cherry tomatoes, bell peppers, mushrooms, and culinary herbs.
            </p>
          </>
        )}

        {page === 'order-info' && (
          <>
            <p className="text-xs sm:text-sm font-semibold text-[#12B326]">
              Ordering &amp; Pricing Guide
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#202820] tracking-tight leading-[1.18]">
              How Ordering &amp; Daily Pricing Work
            </h1>
            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.75] max-w-3xl">
              Fresh produce market rates fluctuate daily. Fresh Farm Vegetables supports two transparent ordering modes:
            </p>
            <ul className="space-y-3.5 text-sm sm:text-base text-[#202820] leading-[1.7] list-disc list-outside pl-5 max-w-3xl">
              <li>
                <strong>Confirmed Live PKR Pricing:</strong> When daily rates have been published by our administrator, customers can add priced items directly to their cart and place an order online.
              </li>
              <li>
                <strong>Rate &amp; Wholesale Quote Inquiries:</strong> When an item is marked &quot;Request Today&apos;s Rate,&quot; customers can build an inquiry list or contact us on WhatsApp ({settings.phoneDisplay}) so our team confirms current pricing and availability prior to finalizing the order.
              </li>
            </ul>
          </>
        )}

        {page === 'privacy' && (
          <>
            <p className="text-xs sm:text-sm font-semibold text-[#12B326]">
              Customer Data Protection
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#202820] tracking-tight leading-[1.18]">
              Privacy Policy
            </h1>
            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.75] max-w-3xl">
              Fresh Farm Vegetables collects customer contact information, delivery addresses, and order or inquiry details strictly to confirm rates, fulfill vegetable deliveries in Lahore, and provide customer support.
            </p>
            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.75] max-w-3xl">
              Customer order records are protected by authentication and are never shared with unauthorized third parties. Payment card numbers or CVV codes are never stored in our database.
            </p>
          </>
        )}

        {page === 'terms' && (
          <>
            <p className="text-xs sm:text-sm font-semibold text-[#12B326]">
              Supply Terms
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#202820] tracking-tight leading-[1.18]">
              Terms and Conditions
            </h1>
            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.75] max-w-3xl">
              All vegetable rates are subject to daily market conditions in PKR. Orders containing unpriced items or items whose daily market rate updated after cart addition require customer confirmation of the current rate before dispatch.
            </p>
            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.75] max-w-3xl">
              Cash on Delivery and service area coverage apply strictly to confirmed Lahore zones enabled by Fresh Farm Vegetables.
            </p>
          </>
        )}

        {page === 'delivery-policy' && (
          <>
            <p className="text-xs sm:text-sm font-semibold text-[#12B326]">
              Lahore Dispatch &amp; Inspection
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#202820] tracking-tight leading-[1.18]">
              Delivery &amp; Returns Policy
            </h1>
            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.75] max-w-3xl">
              Deliveries are dispatched from Commercial CCA, Phase 6, DHA, Lahore to confirmed service zones in Lahore. Where delivery charges or dispatch windows depend on order volume and location, our team confirms the exact arrangement directly with the customer before dispatch.
            </p>
            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.75] max-w-3xl">
              Please inspect fresh produce upon delivery. If any item does not meet agreed order specifications, contact Fresh Farm Vegetables immediately at {settings.phoneDisplay}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
