import React, { useEffect } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { ProduceImage } from '../components/ProduceImage';
import { useStore } from '../context/StoreContext';
import { formatPkr, normalizeDigitsPhone } from '../utils/commerce';

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

  if (page === 'about') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14 sm:space-y-16">
        {/* Editorial About Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <p className="font-signature text-2xl sm:text-[1.85rem] text-[#12B326] py-0.5">
                Rooted in Freshness &amp; Trust
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0F5338] mt-0.5">
                Commercial CCA, Phase 6, DHA · Lahore
              </p>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[3.1rem] font-semibold text-[#202820] tracking-[-0.015em] leading-[1.1] text-balance">
              About Fresh Farm Vegetables
            </h1>

            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.78] max-w-2xl">
              Based in Commercial CCA, Phase 6, Defence Housing Authority (DHA), Lahore, Fresh Farm Vegetables supplies fresh local and imported vegetables to restaurants, hotels, cafés, catering companies, commercial kitchens, and individual households.
            </p>

            <p className="text-sm sm:text-base text-[#4A554C] leading-[1.78] max-w-2xl">
              Our primary house specialty centers on crisp fresh iceberg lettuce and hygienically vacuum-packed lettuce, complemented by a curated 28-item catalog of everyday local produce and specialty imported varieties including romaine lettuce, lolo rose lettuce, rocket leaves, cherry tomatoes, coloured bell peppers, button mushrooms, broccoli, and culinary herbs.
            </p>

            <div className="pt-3 border-t border-[#E4EAE4] max-w-md">
              <p className="font-signature text-3xl sm:text-[2.1rem] text-[#0F5338] py-0.5">
                Fresh Farm Vegetables
              </p>
              <p className="text-xs text-[#687268]">
                Dedicated Produce Supply · Lahore, Pakistan
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border border-[#E4EAE4] bg-white p-2.5">
              <div className="rounded-2xl overflow-hidden aspect-4/3 bg-[#F6F8F6]">
                <ProduceImage
                  src="/images/produce/iceberg-lettuce.jpg"
                  alt="Fresh iceberg lettuce and farm produce at Fresh Farm Vegetables Lahore"
                  eager
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Three Editorial Brand Pillars */}
        <section className="space-y-8">
          <div className="max-w-2xl">
            <p className="font-signature text-2xl sm:text-[1.75rem] text-[#12B326] py-0.5">
              Our Supply Philosophy
            </p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold text-[#202820] tracking-[-0.015em] leading-[1.12]">
              Crafted Around Professional Kitchen Standards
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {[
              {
                icon: Leaf,
                index: '01. House Specialty',
                title: 'Iceberg & Vacuum-Packed Lettuce',
                desc: 'Selected for crisp leaf structure, clean outer trimming, and reliable cold-chain presentation suited to high-volume salad and burger stations.',
              },
              {
                icon: Globe,
                index: '02. Complete Selection',
                title: 'Local & Imported Produce Lines',
                desc: 'Sixteen everyday local kitchen staples alongside twelve imported culinary vegetables and herbs—allowing kitchens to consolidate daily sourcing.',
              },
              {
                icon: CheckCircle2,
                index: '03. Transparent Pricing',
                title: 'Confirmed Daily Market Rates',
                desc: 'Because fresh vegetable rates shift daily, we publish verified PKR rates and confirm multi-item wholesale quotes directly before dispatch.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="bg-white rounded-3xl border border-[#E4EAE4] p-7 sm:p-8 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[#12B326] tracking-wide">
                        {item.index}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#F6F8F6] text-[#0F5338] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-[#18261B] leading-[1.18]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#5C665E] leading-relaxed">{item.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-white rounded-3xl border border-[#E4EAE4] p-7 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="font-signature text-2xl text-[#12B326] py-0.5">
              Source with Confidence
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#202820] leading-[1.14]">
              Explore Our Catalog or Set Up Business Supply
            </h2>
            <p className="text-sm text-[#687268] leading-relaxed">
              View all 28 fresh vegetables online or send your kitchen&apos;s requirement list to our DHA Phase 6 dispatch team.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="h-12 px-6 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>Explore Our Products</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/wholesale')}
              className="h-12 px-6 rounded-xl border border-[#E4EAE4] hover:border-[#12B326] text-[#202820] text-sm font-semibold inline-flex items-center justify-center transition-colors whitespace-nowrap"
            >
              Business Supply
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (page === 'contact') {
    const enabledZones = settings.deliveryZones.filter((z) => z.enabled);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        <div className="max-w-2xl">
          <p className="font-signature text-2xl sm:text-[1.8rem] text-[#12B326] py-0.5">
            Direct Dispatch &amp; Support
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0F5338] mb-1">
            Commercial CCA, Phase 6, DHA · Lahore
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.95rem] font-semibold text-[#202820] tracking-[-0.015em] leading-[1.1]">
            Contact Fresh Farm Vegetables
          </h1>
          <p className="text-sm sm:text-base text-[#687268] leading-relaxed mt-2.5">
            Connect with our Lahore supply team for daily vegetable rates, iceberg and vacuum-packed lettuce availability, and commercial kitchen accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-7 flex flex-col justify-between gap-4 h-full">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] text-[#12B326] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl sm:text-[1.35rem] font-semibold text-[#202820] pt-1 leading-snug">
                Lahore Address
              </h2>
              <p className="text-sm text-[#687268] leading-relaxed">{settings.address}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-7 flex flex-col justify-between gap-4 h-full">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] text-[#12B326] flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl sm:text-[1.35rem] font-semibold text-[#202820] pt-1 leading-snug">
                Phone &amp; WhatsApp
              </h2>
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

          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-7 flex flex-col justify-between gap-4 h-full">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] text-[#12B326] flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl sm:text-[1.35rem] font-semibold text-[#202820] pt-1 leading-snug">
                Email Support
              </h2>
              <a
                href={`mailto:${officialEmail}`}
                className="block text-[13px] xl:text-sm font-semibold text-[#0F5338] hover:text-[#12B326] break-all transition-colors"
              >
                {officialEmail}
              </a>
              <p className="text-xs text-[#687268] leading-relaxed">
                For business supply inquiries, account billing, and supplier correspondence.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-7 flex flex-col justify-between gap-4 h-full">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] text-[#12B326] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl sm:text-[1.35rem] font-semibold text-[#202820] pt-1 leading-snug">
                Business &amp; Kitchen Accounts
              </h2>
              <p className="text-sm text-[#687268] leading-relaxed">
                Submit your multi-item produce list online for restaurants, hotels, cafés, and catering kitchens.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/wholesale')}
              className="w-full h-10 px-4 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Business Supply Form
            </button>
          </div>
        </div>

        {/* Lahore Service Areas & Dispatch Coverage */}
        <section className="bg-white rounded-3xl border border-[#E4EAE4] p-7 sm:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="font-signature text-2xl text-[#12B326] py-0.5">
                Lahore Delivery Coverage
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#202820] leading-[1.14]">
                Active Dispatch Zones Across Lahore
              </h2>
              <p className="text-sm text-[#687268] mt-1.5 leading-relaxed">
                Orders dispatch directly from Commercial CCA, Phase 6, DHA. Delivery charges and dispatch windows are confirmed transparently per area.
              </p>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 rounded-xl bg-[#0F5338] hover:bg-[#003B22] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap self-start md:self-auto"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Confirm Dispatch Window on WhatsApp</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {enabledZones.map((zone) => (
              <div
                key={zone.id}
                className="p-5 rounded-2xl bg-[#F6F8F6] border border-[#E4EAE4] flex flex-col justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-semibold text-[#18261B] leading-snug">
                    {zone.name}
                  </h3>
                  <p className="text-xs text-[#687268] mt-1 leading-relaxed">{zone.notes}</p>
                </div>
                <div className="pt-2 border-t border-[#E4EAE4] flex items-center justify-between text-xs">
                  <span className="text-[#5C665E]">Standard Delivery</span>
                  <span className="font-mono font-semibold text-[#0F5338] tabular-nums">
                    {zone.deliveryFeePkr !== null ? formatPkr(zone.deliveryFeePkr) : 'Confirmed by team'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="bg-white rounded-3xl border border-[#E4EAE4] p-7 sm:p-10 space-y-5">
        {page === 'order-info' && (
          <>
            <p className="font-signature text-2xl text-[#12B326] py-0.5">
              Ordering &amp; Pricing Guide
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#202820] tracking-[-0.015em] leading-[1.12]">
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
                <strong>Rate &amp; Business Supply Inquiries:</strong> When an item is marked &quot;Request Today&apos;s Rate,&quot; customers can build an inquiry list or contact us on WhatsApp ({settings.phoneDisplay}) so our team confirms current pricing and availability prior to finalizing the order.
              </li>
            </ul>
          </>
        )}

        {page === 'privacy' && (
          <>
            <p className="font-signature text-2xl text-[#12B326] py-0.5">
              Customer Data Protection
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#202820] tracking-[-0.015em] leading-[1.12]">
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
            <p className="font-signature text-2xl text-[#12B326] py-0.5">
              Supply Terms
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#202820] tracking-[-0.015em] leading-[1.12]">
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
            <p className="font-signature text-2xl text-[#12B326] py-0.5">
              Lahore Dispatch &amp; Inspection
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#202820] tracking-[-0.015em] leading-[1.12]">
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
