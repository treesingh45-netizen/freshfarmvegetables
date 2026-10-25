import React, { useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
  Sprout,
} from 'lucide-react';
import { ProduceImage } from '../components/ProduceImage';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { normalizeDigitsPhone } from '../utils/commerce';
import heroVegetablesPhoto from '../assets/images/fresh_vegetables_hero_1792926611708.jpg';

const FEATURED_SLUGS = [
  'iceberg-lettuce',
  'vacuum-packed-lettuce',
  'tomatoes',
  'green-capsicum',
  'cherry-tomatoes',
  'romaine-lettuce',
  'broccoli',
  'cucumbers',
  'red-capsicum',
  'mushrooms',
  'lemons',
  'potatoes',
];

export function HomePage() {
  const { products, settings, navigate } = useStore();
  const [heroImgSrc, setHeroImgSrc] = React.useState<string>(heroVegetablesPhoto);

  useEffect(() => {
    document.title = 'Fresh Farm Vegetables — Fresh Vegetable Supplier in Lahore';
  }, []);

  const featuredProducts = useMemo(() => {
    const enabled = products.filter((p) => p.enabled);
    const bySlug = new Map(enabled.map((p) => [p.slug, p]));
    const ordered = FEATURED_SLUGS.map((s) => bySlug.get(s)).filter(Boolean) as typeof products;
    const extras = enabled.filter((p) => p.featured && !FEATURED_SLUGS.includes(p.slug));
    return [...ordered, ...extras].slice(0, 12);
  }, [products]);

  const digits = normalizeDigitsPhone(settings.whatsappIntl || '+923334934403');
  const heroWhatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
    "Hello Fresh Farm Vegetables, I would like to place a fresh vegetable order and check today's rates for Lahore delivery."
  )}`;
  const wholesaleWhatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
    "Hello Fresh Farm Vegetables, we would like to discuss wholesale vegetable supply and today's market rates for our kitchen."
  )}`;

  return (
    <div className="space-y-16 sm:space-y-20 pb-8">
      {/* Section A: Full-Screen Edge-to-Edge Hero */}
      <section
        aria-label="Fresh Farm Vegetables Hero"
        className="relative w-full min-h-[calc(100svh-6.75rem)] sm:min-h-[680px] lg:h-screen overflow-hidden bg-[#062315] flex items-center justify-center"
      >
        <img
          src={heroImgSrc}
          alt="Fresh iceberg lettuce, ripe red tomatoes, green capsicum, carrots, and leafy greens"
          loading="eager"
          fetchPriority="high"
          referrerPolicy="no-referrer"
          onError={() => {
            if (heroImgSrc !== '/images/produce/hero-produce.jpg') {
              setHeroImgSrc('/images/produce/hero-produce.jpg');
            }
          }}
          className="absolute inset-0 w-full h-full object-cover object-center ffv-hero-bg-motion select-none"
        />

        {/* Subtle Dark Forest-Green Scrim for Reliable Contrast */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#072919]/52"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#041B10]/65 via-[#072919]/42 to-[#041B10]/72"
        />

        {/* Centered Hero Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 flex flex-col items-center justify-center text-center">
          <p className="ffv-hero-enter-1 ffv-hero-text-shadow text-[11px] sm:text-xs md:text-[13px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.22em] text-white/90 mb-4 sm:mb-5">
            FRESH FARM VEGETABLES · LAHORE, PAKISTAN
          </p>

          <h1 className="ffv-hero-enter-2 ffv-hero-text-shadow font-display text-[2rem] sm:text-5xl md:text-[3.5rem] lg:text-[4rem] font-bold text-white tracking-tight leading-[1.14] sm:leading-[1.08] max-w-3xl lg:max-w-4xl mb-5 sm:mb-6 text-balance">
            Freshness You Can Taste.{' '}
            <br className="hidden sm:inline" />
            Quality You Can Trust.
          </h1>

          <p className="ffv-hero-enter-3 ffv-hero-text-shadow text-base sm:text-lg md:text-xl text-white/92 font-normal leading-relaxed max-w-2xl mb-8 sm:mb-10 text-pretty">
            Premium farm-fresh vegetables and specialty lettuce for restaurants, hotels, cafés, and professional kitchens.
          </p>

          <div className="ffv-hero-enter-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 w-full max-w-xs sm:max-w-none sm:w-auto">
            <a
              href="/products"
              onClick={(e) => {
                e.preventDefault();
                navigate('/products');
              }}
              className="w-full sm:w-auto min-w-[215px] h-12 sm:h-13 px-7 sm:px-8 rounded-xl bg-[#12B326] hover:bg-[#16C72E] text-white text-sm sm:text-base font-semibold inline-flex items-center justify-center shadow-lg shadow-black/25 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap"
            >
              Explore Our Products
            </a>

            <a
              href={heroWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-w-[215px] h-12 sm:h-13 px-7 sm:px-8 rounded-xl bg-white hover:bg-[#F2F7F3] text-[#0B3D26] text-sm sm:text-base font-semibold inline-flex items-center justify-center shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap"
            >
              Order on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Section B: Business Value Propositions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              icon: Sprout,
              title: 'Fresh Produce',
              desc: 'A selection of fresh local and imported vegetables.',
            },
            {
              icon: Leaf,
              title: 'Lettuce Specialists',
              desc: 'Dedicated emphasis on iceberg and vacuum-packed lettuce.',
            },
            {
              icon: Building2,
              title: 'Business Supply',
              desc: 'Products for restaurants, hotels, and commercial kitchens.',
            },
            {
              icon: ShoppingBag,
              title: 'Convenient Ordering',
              desc: 'Contact the supplier for current prices, availability, and ordering arrangements.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E4EAE4] flex items-start gap-3.5 h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] text-[#12B326] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-[15px] font-bold text-[#202820] leading-snug mb-1">
                    {item.title}
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#687268] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section C: Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-semibold text-[#12B326] mb-1.5">
              Core Selection
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202820] tracking-tight leading-[1.2]">
              Featured Fresh Produce
            </h2>
            <p className="text-sm sm:text-base text-[#687268] leading-relaxed mt-1.5">
              Highlighting our signature lettuce varieties and everyday kitchen essentials.
            </p>
          </div>
          <a
            href="/products"
            onClick={(e) => {
              e.preventDefault();
              navigate('/products');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#12B326] hover:text-[#0F5338] transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <span>View Complete Catalog (28 Items)</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Section D: Browse by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold text-[#12B326] mb-1.5">
            Curated Lines
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#202820] tracking-tight leading-[1.2]">
            Browse by Category
          </h2>
          <p className="text-sm sm:text-base text-[#687268] leading-relaxed mt-1.5">
            Explore fresh daily harvests, imported culinary produce, and our dedicated lettuce collection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Local Vegetables',
              desc: 'Everyday fresh vegetables for commercial and household kitchens.',
              href: '/products?category=local',
              img: '/images/produce/tomatoes.jpg',
              meta: '16 Fresh Varieties',
            },
            {
              title: 'Imported Vegetables',
              desc: 'Selected imported vegetable varieties and specialty produce.',
              href: '/products?category=imported',
              img: '/images/produce/red-capsicum.jpg',
              meta: '12 Specialty Varieties',
            },
            {
              title: 'Lettuce Collection',
              desc: 'Iceberg, vacuum-packed, romaine, and lolo rose lettuce.',
              href: '/products?category=lettuce-collection',
              img: '/images/produce/romaine-lettuce.jpg',
              meta: '4 Culinary Lettuce Varieties',
            },
          ].map((cat) => (
            <a
              key={cat.title}
              href={cat.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(cat.href);
              }}
              className="group bg-white rounded-2xl border border-[#E4EAE4] overflow-hidden flex flex-col hover:border-[#12B326] transition-colors"
            >
              <div className="aspect-16/10 bg-[#F6F8F6] overflow-hidden">
                <ProduceImage
                  src={cat.img}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-xs text-[#687268] mb-1">{cat.meta}</p>
                <h3 className="text-lg font-bold text-[#202820] group-hover:text-[#12B326] transition-colors mb-2">
                  {cat.title}
                </h3>
                <p className="text-sm text-[#687268] leading-relaxed mb-4 flex-1">{cat.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F5338] group-hover:text-[#12B326]">
                  <span>Browse Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Section E: Wholesale Supply */}
      <section className="bg-[#0F5338] text-white py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs sm:text-sm font-semibold text-[#16C72E]">
                Restaurants · Hotels · Cafés · Commercial Kitchens
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.16] text-balance">
                Your Trusted Partner for Fresh Produce
              </h2>
              <p className="text-sm sm:text-base text-white/88 leading-relaxed max-w-2xl text-pretty">
                Looking for a dependable vegetable supplier for your restaurant, hotel, or professional kitchen? Contact Fresh Farm Vegetables to discuss your requirements, order quantities, and today&apos;s market rates.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 pt-2 max-w-2xl text-sm sm:text-[15px] text-white/95">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-[18px] h-[18px] text-[#16C72E] shrink-0 mt-[2px]" />
                  <span className="leading-snug">Iceberg &amp; vacuum-packed lettuce</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-[18px] h-[18px] text-[#16C72E] shrink-0 mt-[2px]" />
                  <span className="leading-snug">Multi-item wholesale rate inquiries</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-[18px] h-[18px] text-[#16C72E] shrink-0 mt-[2px]" />
                  <span className="leading-snug">Local &amp; imported kitchen produce</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-[18px] h-[18px] text-[#16C72E] shrink-0 mt-[2px]" />
                  <span className="leading-snug">Direct WhatsApp rate confirmation</span>
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-3">
                <a
                  href="/wholesale"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/wholesale');
                  }}
                  className="h-12 px-6 rounded-xl bg-[#12B326] hover:bg-[#16C72E] text-white text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <span>Request a Wholesale Quote</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </a>
                <a
                  href={wholesaleWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 px-6 rounded-xl border border-white/30 hover:bg-white/10 text-white text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Contact Us on WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#003B22]">
                <ProduceImage
                  src="/images/produce/wholesale-kitchen.jpg"
                  alt="Fresh farm vegetables prepared for restaurant and hotel supply"
                  className="w-full aspect-4/3 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section F: Trusted by Our Customers */}
      <section
        aria-labelledby="trusted-customers-heading"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-12">
          <p className="text-xs sm:text-sm font-semibold text-[#12B326] tracking-wide mb-2">
            Trusted by Our Customers
          </p>
          <h2
            id="trusted-customers-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#202820] tracking-tight leading-[1.15] text-balance mb-3.5"
          >
            Quality Produce. Reliable Service. Happy Kitchens.
          </h2>
          <p className="text-sm sm:text-base text-[#687268] leading-relaxed text-balance">
            We are committed to delivering fresh, quality vegetables and dependable service to restaurants, hotels, and professional kitchens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {[
            {
              title: 'Client Review 01 — Product Quality',
              quote:
                '“Fresh Farm Vegetables provides excellent-quality produce. The vegetables are fresh, well presented, and suitable for our kitchen\'s daily needs.”',
              author: '— Restaurant Customer',
            },
            {
              title: 'Client Review 02 — Freshness & Consistency',
              quote:
                '“We appreciate the quality of their fresh vegetables and their focus on consistent supply. A helpful option for professional food businesses.”',
              author: '— Food Business Customer',
            },
            {
              title: 'Client Review 03 — Customer Service',
              quote:
                '“Professional communication and a good selection of local and imported vegetables make sourcing our kitchen essentials more convenient.”',
              author: '— Hospitality Customer',
            },
          ].map((review) => (
            <article
              key={review.title}
              className="bg-white rounded-2xl border border-[#E4EAE4] p-7 sm:p-8 flex flex-col justify-between hover:border-[#12B326]/50 transition-colors"
            >
              <div>
                <div className="pb-4 border-b border-[#E4EAE4]">
                  <h3 className="text-xs sm:text-[13px] font-semibold text-[#0F5338] tracking-tight tabular-nums">
                    {review.title}
                  </h3>
                </div>
                <blockquote className="py-6 text-[15.5px] sm:text-base text-[#202820] leading-[1.7] font-normal">
                  {review.quote}
                </blockquote>
              </div>
              <div className="pt-4 border-t border-[#F0F4F0]">
                <p className="text-sm font-semibold text-[#0F5338]">{review.author}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section G: Contact Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3.5 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202820] tracking-tight leading-[1.2] text-balance">
              Let&apos;s Talk About Your Fresh Produce Requirements
            </h2>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-6 gap-y-2.5 text-sm text-[#687268]">
              <a
                href={`tel:${settings.phoneDisplay}`}
                className="inline-flex items-center gap-2 text-[#202820] font-medium hover:text-[#12B326] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#12B326] shrink-0" />
                <span className="font-mono tabular-nums">{settings.phoneDisplay}</span>
              </a>
              <a
                href={`mailto:${settings.email || 'farmfreshvegetables@gmail.com'}`}
                className="inline-flex items-center gap-2 text-[#202820] font-medium hover:text-[#12B326] transition-colors break-all"
              >
                <Mail className="w-4 h-4 text-[#12B326] shrink-0" />
                <span>{settings.email || 'farmfreshvegetables@gmail.com'}</span>
              </a>
              <span className="inline-flex items-start sm:items-center gap-2 leading-snug">
                <MapPin className="w-4 h-4 text-[#12B326] shrink-0 mt-0.5 sm:mt-0" />
                <span>{settings.address}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                navigate('/contact');
              }}
              className="h-12 px-6 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold inline-flex items-center justify-center transition-colors whitespace-nowrap"
            >
              Contact Fresh Farm Vegetables
            </a>
            <a
              href={heroWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-5 rounded-xl border border-[#E4EAE4] hover:border-[#12B326] text-[#202820] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 text-[#12B326] shrink-0" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
