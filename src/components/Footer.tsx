import React, { useState } from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { normalizeDigitsPhone } from '../utils/commerce';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  const { settings, navigate } = useStore();
  const [socialNotice, setSocialNotice] = useState('');

  const digits = normalizeDigitsPhone(settings.whatsappIntl || '+923334934403');
  const officialEmail = settings.email || 'farmfreshvegetables@gmail.com';
  const whatsappHref = `https://wa.me/${digits}?text=${encodeURIComponent(
    "Hello Fresh Farm Vegetables, I would like today's vegetable rates and availability in Lahore."
  )}`;

  const footerLink = (href: string, label: string) => (
    <li>
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          navigate(href);
        }}
        className="text-[14px] font-sans text-[#222B24] hover:text-[#12B326] transition-colors"
      >
        {label}
      </a>
    </li>
  );

  return (
    <footer className="bg-[#F7F8F7] text-[#1E2620] border-t border-[#E4EAE4] mt-16 relative">
      {/* Subtle Top Brand Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0F5338] via-[#12B326] to-[#8EE04E]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
        {/* Top Row: Connect With Us (Left) + Editorial Brand Signature Detail (Right) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#E4EAE4]/80 mb-9">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[14.5px] font-sans font-semibold text-[#1E2620]">
                Connect with us
              </span>
              <div className="flex items-center gap-2.5">
                {settings.facebookUrl ? (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Fresh Farm Vegetables on Facebook"
                    className="w-9 h-9 rounded-full bg-[#383B39] hover:bg-[#12B326] text-white flex items-center justify-center transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setSocialNotice(
                        `Connect directly on WhatsApp (${settings.phoneDisplay}) or email ${officialEmail}. Official Facebook URL can be linked in Admin Settings.`
                      )
                    }
                    aria-label="Facebook contact info"
                    className="w-9 h-9 rounded-full bg-[#383B39] hover:bg-[#12B326] text-white flex items-center justify-center transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </button>
                )}

                {settings.instagramUrl ? (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Fresh Farm Vegetables on Instagram"
                    className="w-9 h-9 rounded-full bg-[#383B39] hover:bg-[#12B326] text-white flex items-center justify-center transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setSocialNotice(
                        `Connect directly on WhatsApp (${settings.phoneDisplay}) or email ${officialEmail}. Official Instagram URL can be linked in Admin Settings.`
                      )
                    }
                    aria-label="Instagram contact info"
                    className="w-9 h-9 rounded-full bg-[#383B39] hover:bg-[#12B326] text-white flex items-center justify-center transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </button>
                )}

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Connect with Fresh Farm Vegetables on WhatsApp"
                  className="w-9 h-9 rounded-full bg-[#383B39] hover:bg-[#12B326] text-white flex items-center justify-center transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.57c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29z" />
                  </svg>
                </a>
              </div>
            </div>
            {socialNotice && <p className="text-xs text-[#5C665E] mt-2">{socialNotice}</p>}
          </div>

          <div className="flex flex-col sm:items-end gap-0.5">
            <span className="font-signature text-2xl sm:text-[1.7rem] text-[#0F5338] py-0.5">
              Freshness from Farm to Kitchen
            </span>
            <span className="text-xs text-[#687268]">
              Commercial CCA, Phase 6, DHA · Lahore, Pakistan
            </span>
          </div>
        </div>

        {/* Main 5-Zone Footer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-6 pb-10">
          {/* Column 1: Pages */}
          <div className="lg:col-span-2">
            <p className="text-xs font-sans font-bold text-[#0F5338] tracking-wide mb-3.5">
              Explore
            </p>
            <ul className="space-y-3">
              {footerLink('/', 'Home')}
              {footerLink('/products', 'Products')}
              {footerLink('/about', 'About Us')}
              {footerLink('/wholesale', 'Business Supply')}
              {footerLink('/reviews', 'Client Reviews')}
              {footerLink('/contact', 'Contact Us')}
            </ul>
          </div>

          {/* Column 2: Customer Care & Policies */}
          <div className="lg:col-span-2">
            <p className="text-xs font-sans font-bold text-[#0F5338] tracking-wide mb-3.5">
              Customer Care
            </p>
            <ul className="space-y-3">
              {footerLink('/account', 'My Account')}
              {footerLink('/order-info', 'Order Information')}
              {footerLink('/delivery-policy', 'Delivery & Return Policy')}
              {footerLink('/privacy', 'Privacy Policy')}
              {footerLink('/terms', 'Terms & Conditions')}
            </ul>
          </div>

          {/* Column 3: Core Categories */}
          <div className="lg:col-span-2">
            <p className="text-xs font-sans font-bold text-[#0F5338] tracking-wide mb-3.5">
              Produce Lines
            </p>
            <ul className="space-y-3">
              {footerLink('/products?category=iceberg-lettuce', 'Iceberg Lettuce')}
              {footerLink('/products?category=vacuum-packed-lettuce', 'Vacuum-Packed Lettuce')}
              {footerLink('/products?category=local', 'Local Vegetables')}
              {footerLink('/products?category=imported', 'Imported Vegetables')}
              {footerLink('/products?category=lettuce-collection', 'Lettuce Collection')}
              {footerLink('/products', 'All Vegetables')}
            </ul>
          </div>

          {/* Column 4: Kitchen Staples & Product Details */}
          <div className="lg:col-span-2">
            <p className="text-xs font-sans font-bold text-[#0F5338] tracking-wide mb-3.5">
              Kitchen Staples
            </p>
            <ul className="space-y-3">
              {footerLink('/products/iceberg-lettuce', 'Iceberg Lettuce Details')}
              {footerLink('/products/cherry-tomatoes', 'Cherry Tomatoes')}
              {footerLink('/products/broccoli', 'Broccoli')}
              {footerLink('/products/red-capsicum', 'Red Capsicum')}
              {footerLink('/products/mushrooms', 'Button Mushrooms')}
              {footerLink('/admin', 'Admin Dashboard')}
            </ul>
          </div>

          {/* Column 5: Outlined Help Center & Phone Support Cards */}
          <div className="col-span-2 md:col-span-4 lg:col-span-4 space-y-4">
            <a
              href={`mailto:${officialEmail}`}
              className="flex items-center gap-3.5 bg-white rounded-xl border-[1.5px] border-[#A3E635] hover:border-[#12B326] px-5 py-3.5 transition-colors shadow-[0_2px_8px_rgba(15,83,56,0.03)]"
            >
              <Mail className="w-5 h-5 text-[#0D3B2E] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-[#65A30D] tracking-wide">
                  Email Inquiries
                </span>
                <span className="block text-[13.5px] font-semibold text-[#0D3B2E] truncate">
                  {officialEmail}
                </span>
              </div>
            </a>

            <a
              href={`tel:${settings.phoneDisplay}`}
              className="flex items-center gap-3.5 bg-white rounded-xl border-[1.5px] border-[#A3E635] hover:border-[#12B326] px-5 py-3.5 transition-colors shadow-[0_2px_8px_rgba(15,83,56,0.03)]"
            >
              <Phone className="w-5 h-5 text-[#0D3B2E] fill-current shrink-0" />
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-[#65A30D] tracking-wide">
                  Phone &amp; WhatsApp
                </span>
                <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[13.5px] font-bold text-[#0D3B2E] font-mono tabular-nums">
                  <span>{settings.phoneDisplay}</span>
                  <span className="text-xs font-medium text-[#5C665E]">
                    ({settings.whatsappIntl})
                  </span>
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom Brand & Address Bar */}
        <div className="pt-6 border-t border-[#E4EAE4] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              aria-label="Fresh Farm Vegetables Home"
              className="shrink-0"
            >
              <BrandLogo variant="full" />
            </a>
            <span className="hidden sm:inline text-[#C8D2C8]" aria-hidden="true">
              |
            </span>
            <span className="inline-flex items-start sm:items-center gap-1.5 text-xs text-[#5C665E] leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-[#12B326] shrink-0 mt-0.5 sm:mt-0" />
              <span>{settings.address}</span>
            </span>
          </div>

          <p className="text-xs text-[#5C665E] leading-relaxed">
            Copyright {new Date().getFullYear()} {settings.businessName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
