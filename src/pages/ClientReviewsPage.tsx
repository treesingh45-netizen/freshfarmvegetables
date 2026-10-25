import React, { useEffect } from 'react';
import { ArrowRight, Building2, CheckCircle2, Clock, Leaf } from 'lucide-react';
import { ClientReviewsSection } from '../components/ClientReviewsSection';
import { useStore } from '../context/StoreContext';

export function ClientReviewsPage() {
  const { navigate } = useStore();

  useEffect(() => {
    document.title = 'Client Reviews — Fresh Farm Vegetables Lahore';
  }, []);

  return (
    <div className="py-10 sm:py-14 space-y-14 sm:space-y-16">
      {/* Main Client Reviews Section */}
      <ClientReviewsSection headingTag="h1" limit={3} />

      {/* Kitchen Sectors We Serve */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E4EAE4] shadow-[0_10px_30px_-18px_rgba(15,83,56,0.08)] p-7 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <p className="font-signature text-2xl sm:text-[1.8rem] text-[#12B326] py-0.5">
                Built for Culinary Standards
              </p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-[#202820] leading-[1.14]">
                Why Professional Kitchens Partner with Fresh Farm Vegetables
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#5C665E] leading-relaxed">
                Dispatched from Commercial CCA, Phase 6, DHA, Lahore, our supply workflow is tailored around morning prep windows, clean presentation, and dependable daily produce coordination.
              </p>
              <p className="font-signature text-2xl sm:text-[1.8rem] text-[#0F5338] pt-1">
                Fresh Farm Vegetables, Lahore
              </p>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Leaf,
                  title: 'Lettuce & Greens',
                  desc: 'Crisp iceberg, vacuum-packed lettuce, romaine, lolo rose, and rocket leaves.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Inspected Selection',
                  desc: 'Sorted local staples and imported culinary vegetables prepared for daily service.',
                },
                {
                  icon: Building2,
                  title: 'Hospitality Supply',
                  desc: 'Flexible quantities for restaurants, hotels, cafés, and banquet catering.',
                },
                {
                  icon: Clock,
                  title: 'Dependable Scheduling',
                  desc: 'Transparent daily PKR market rate confirmation before finalizing kitchen supply orders.',
                },
              ].map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="p-5 rounded-2xl bg-[#F6F8F6] border border-[#E4EAE4] space-y-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E4EAE4] text-[#12B326] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-[#18261B]">
                      {pillar.title}
                    </h3>
                    <p className="font-sans text-xs sm:text-[13px] text-[#5C665E] leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation Banner (No App Store, Google Play, or WhatsApp ordering buttons) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0F5338] text-white rounded-3xl p-7 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-2.5 max-w-2xl">
            <p className="font-signature text-2xl sm:text-[1.75rem] text-[#7CE88B]">
              Ready to Source Fresh Produce?
            </p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold leading-[1.14]">
              Explore Our Fresh Produce Range for Your Kitchen
            </h2>
            <p className="font-sans text-sm sm:text-base text-white/85 leading-relaxed">
              Browse our 28-item catalog of local and imported vegetables or submit your kitchen&apos;s recurring supply inquiry.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="h-12 px-6 rounded-xl bg-[#12B326] hover:bg-[#16C72E] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>Explore Our Products</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/wholesale')}
              className="h-12 px-6 rounded-xl border border-white/30 hover:bg-white/10 text-white text-sm font-semibold inline-flex items-center justify-center transition-colors whitespace-nowrap"
            >
              <span>Business Supply Inquiry</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
