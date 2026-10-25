import React, { useState } from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { normalizeDigitsPhone } from '../utils/commerce';
import { BrandLogo } from './BrandLogo';

export function AppStoreBadges({ inverse = false }: { inverse?: boolean }) {
  const { settings } = useStore();
  const [notice, setNotice] = useState('');

  const handleUnverifiedClick = (storeName: string) => {
    setNotice(
      `Official ${storeName} link will open automatically once published in Admin Settings. Order directly via WhatsApp (${settings.phoneDisplay}) or web catalog.`
    );
  };

  const badgeClass = inverse
    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
    : 'bg-[#3C3E3D] hover:bg-[#232824] border-[#3C3E3D] text-white';

  const appleSvg = (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current shrink-0" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
    </svg>
  );

  const playSvg = (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden="true">
      <path d="M3.6 2.4c-.3.3-.5.8-.5 1.4v16.4c0 .6.2 1.1.5 1.4l.1.1L13 12.4v-.2L3.7 2.3l-.1.1zm12.5 13.2l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.7 2.1-.1-.1zM16.2 15.5L13 12.3 3.7 21.6c.4.4 1 .4 1.7 0l10.8-6.1zm0-6.6L5.4 2.8c-.7-.4-1.3-.4-1.7 0L13 12.1l3.2-3.2z" />
    </svg>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {settings.appStoreVerified && settings.appStoreUrl ? (
          <a
            href={settings.appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-lg border transition-colors min-w-[148px] ${badgeClass}`}
          >
            {appleSvg}
            <span className="text-left leading-tight">
              <span className="block text-[10px] opacity-85">Download on the</span>
              <span className="block text-sm font-semibold tracking-tight">App Store</span>
            </span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => handleUnverifiedClick('App Store')}
            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-lg border transition-colors min-w-[148px] ${badgeClass}`}
          >
            {appleSvg}
            <span className="text-left leading-tight">
              <span className="block text-[10px] opacity-85">Download on the</span>
              <span className="block text-sm font-semibold tracking-tight">App Store</span>
            </span>
          </button>
        )}

        {settings.playStoreVerified && settings.playStoreUrl ? (
          <a
            href={settings.playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-lg border transition-colors min-w-[148px] ${badgeClass}`}
          >
            {playSvg}
            <span className="text-left leading-tight">
              <span className="block text-[10px] opacity-85">Get it on</span>
              <span className="block text-sm font-semibold tracking-tight">Google Play</span>
            </span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => handleUnverifiedClick('Google Play')}
            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-lg border transition-colors min-w-[148px] ${badgeClass}`}
          >
            {playSvg}
            <span className="text-left leading-tight">
              <span className="block text-[10px] opacity-85">Get it on</span>
              <span className="block text-sm font-semibold tracking-tight">Google Play</span>
            </span>
          </button>
        )}
      </div>
      {notice && (
        <p className={`mt-2 text-xs max-w-md ${inverse ? 'text-white/80' : 'text-[#5C665E]'}`}>
          {notice}
        </p>
      )}
    </div>
  );
}

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
        className="text-[14px] text-[#222B24] hover:text-[#12B326] transition-colors"
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
        {/* Top Row: Connect With Us (Left) + App Store Badges (Right) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-[#E4EAE4]/80 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[15px] font-semibold text-[#1E2620]">Connect with us</span>
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

          <AppStoreBadges />
        </div>

        {/* Main 5-Zone Footer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-6 pb-10">
          {/* Column 1: Company & Policies */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold text-[#0F5338] tracking-wide mb-3.5">
              Company
            </h2>
            <ul className="space-y-3">
              {footerLink('/about', 'About Us')}
              {footerLink('/contact', 'Contact Us')}
              {footerLink('/privacy', 'Privacy Policy')}
              {footerLink('/order-info', 'Order Information')}
              {footerLink('/terms', 'Terms & Conditions')}
            </ul>
          </div>

          {/* Column 2: Customer Account & Supply */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold text-[#0F5338] tracking-wide mb-3.5">
              Customer Care
            </h2>
            <ul className="space-y-3">
              {footerLink('/account', 'Login')}
              {footerLink('/account', 'My Account')}
              {footerLink('/delivery-policy', 'Delivery & Return Policy')}
              {footerLink('/contact', 'Lahore Service Areas')}
              {footerLink('/wholesale', 'Wholesale Supply')}
            </ul>
          </div>

          {/* Column 3: Core Categories */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold text-[#0F5338] tracking-wide mb-3.5">
              Produce Lines
            </h2>
            <ul className="space-y-3">
              {footerLink('/products?category=iceberg-lettuce', 'Iceberg Lettuce')}
              {footerLink('/products?category=vacuum-packed-lettuce', 'Vacuum-Packed Lettuce')}
              {footerLink('/products?category=local', 'Local Vegetables')}
              {footerLink('/products?category=imported', 'Imported Vegetables')}
              {footerLink('/products?category=lettuce-collection', 'Lettuce Collection')}
              {footerLink('/products', 'All Vegetables')}
            </ul>
          </div>

          {/* Column 4: Kitchen Essentials & Admin */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold text-[#0F5338] tracking-wide mb-3.5">
              Kitchen Staples
            </h2>
            <ul className="space-y-3">
              {footerLink('/products/cherry-tomatoes', 'Cherry Tomatoes')}
              {footerLink('/products/broccoli', 'Broccoli')}
              {footerLink('/products?q=Capsicum', 'Bell Peppers')}
              {footerLink('/products?q=Basil', 'Fresh Culinary Herbs')}
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
                  HELP CENTER
                </span>
                <span className="block text-[13.5px] font-bold text-[#0D3B2E] truncate">
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
                  PHONE SUPPORT
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
