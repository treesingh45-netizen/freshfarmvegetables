import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  Heart,
  MapPin,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPkr } from '../utils/commerce';
import { BrandLogo } from './BrandLogo';
import { ProduceImage } from './ProduceImage';

const RIBBON_ITEMS: {
  id: string;
  label: string;
  href: string;
}[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'all', label: 'Products', href: '/products' },
  { id: 'local', label: 'Local Vegetables', href: '/products?category=local' },
  { id: 'imported', label: 'Imported Vegetables', href: '/products?category=imported' },
  {
    id: 'lettuce-collection',
    label: 'Lettuce Specialties',
    href: '/products?category=lettuce-collection',
  },
  { id: 'wholesale', label: 'Business Supply', href: '/wholesale' },
  { id: 'reviews', label: 'Client Reviews', href: '/reviews' },
  { id: 'about', label: 'About Us', href: '/about' },
  { id: 'contact', label: 'Contact Us', href: '/contact' },
];

export function Header() {
  const {
    products,
    settings,
    user,
    cartSummary,
    selectedZoneId,
    setSelectedZoneId,
    openCartDrawer,
    openSmartList,
    currentPath,
    currentSearch,
    navigate,
  } = useStore();

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(currentSearch);
    const urlQ = params.get('q') || '';
    if (currentPath === '/products') {
      setQuery(urlQ);
    }
  }, [currentPath, currentSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.enabled && p.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [products, query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/products?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/products');
    }
  };

  const activeCategory = useMemo(() => {
    if (currentPath === '/' || currentPath === '') return 'home';
    if (currentPath === '/wholesale' || currentPath === '/business-supply') return 'wholesale';
    if (currentPath === '/reviews') return 'reviews';
    if (currentPath === '/about') return 'about';
    if (currentPath === '/contact') return 'contact';
    if (currentPath.startsWith('/products/')) return 'all';
    if (currentPath !== '/products') return '';
    const params = new URLSearchParams(currentSearch);
    const cat = params.get('category') || 'all';
    if (cat === 'iceberg-lettuce' || cat === 'vacuum-packed-lettuce') {
      return 'lettuce-collection';
    }
    return cat;
  }, [currentPath, currentSearch]);

  const activeZone = useMemo(
    () =>
      settings.deliveryZones.find((z) => z.id === selectedZoneId && z.enabled) ||
      settings.deliveryZones[0],
    [settings.deliveryZones, selectedZoneId]
  );

  const favCount = user?.favoriteProductIds?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E4EAE4]">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2.5 sm:gap-4 lg:gap-6">
        {/* Left: Logo */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="focus-visible:outline-2 focus-visible:outline-[#12B326] rounded-lg shrink-0"
          aria-label="Fresh Farm Vegetables Home"
        >
          <span className="sm:hidden">
            <BrandLogo variant="symbol" />
          </span>
          <span className="hidden sm:inline-flex">
            <BrandLogo variant="full" />
          </span>
        </a>

        {/* Center: Search Input with Live Suggestions */}
        <div ref={searchContainerRef} className="relative flex-1 min-w-0 max-w-xl">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-[#687268] absolute left-3 sm:left-3.5 pointer-events-none" />
            <input
              type="search"
              value={query}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Search vegetables..."
              aria-label="Search fresh vegetables"
              className={`w-full h-10 sm:h-11 pl-9 sm:pl-10 ${query ? 'pr-8' : 'pr-3.5'} lg:pr-32 rounded-full bg-[#F6F8F6] border border-[#E4EAE4] text-[13px] sm:text-sm text-[#202820] placeholder:text-[#687268] truncate focus:bg-white focus:border-[#12B326] focus:outline-none transition-colors`}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 lg:right-[6.5rem] p-1 text-[#687268] hover:text-[#202820]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={openSmartList}
              title="Paste a quick vegetable order list"
              className="hidden lg:inline-flex items-center gap-1.5 absolute right-1.5 h-8 px-3 rounded-full bg-white border border-[#E4EAE4] text-xs font-medium text-[#0F5338] hover:border-[#12B326] hover:text-[#12B326] transition-colors whitespace-nowrap"
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span>Quick List</span>
            </button>
          </form>

          {searchFocused && query.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[#E4EAE4] shadow-lg overflow-hidden z-50">
              {suggestions.length > 0 ? (
                <div className="divide-y divide-[#E4EAE4]">
                  {suggestions.map((prod) => (
                    <a
                      key={prod.id}
                      href={`/products/${prod.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSearchFocused(false);
                        navigate(`/products/${prod.slug}`);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-[#F6F8F6] transition-colors"
                    >
                      <ProduceImage
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#E4EAE4]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#202820] truncate">
                          {prod.name}
                        </p>
                        <p className="text-xs text-[#687268]">
                          {prod.origin === 'local' ? 'Local Produce' : 'Imported Produce'}
                          {prod.isSpecialty ? ' · House Specialty' : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {prod.pricingMode === 'live' && prod.pricePkr !== null ? (
                          <span className="text-xs font-mono font-semibold text-[#0F5338] tabular-nums">
                            {formatPkr(prod.pricePkr)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-[#12B326]">
                            Request Rate
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFocused(false);
                      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
                    }}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-[#0F5338] bg-[#F6F8F6] hover:bg-[#E4EAE4]/60 text-left transition-colors"
                  >
                    View all matching results for "{query.trim()}"
                  </button>
                </div>
              ) : (
                <div className="p-4 text-sm text-[#687268]">
                  No vegetables matched "{query.trim()}".{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFocused(false);
                      navigate('/wholesale');
                    }}
                    className="text-[#12B326] font-semibold underline"
                  >
                    Submit a custom wholesale inquiry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Location, Account, Wishlist, Cart, Request Today's Rates */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setZoneModalOpen(true)}
            aria-label="Select Lahore delivery area"
            className="hidden xl:inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[#E4EAE4] text-xs font-medium text-[#202820] hover:border-[#12B326] transition-colors max-w-[190px]"
          >
            <MapPin className="w-3.5 h-3.5 text-[#12B326] shrink-0" />
            <span className="truncate">{activeZone ? activeZone.name.split(',')[0] : 'Lahore'}</span>
          </button>

          <a
            href={user?.role === 'admin' ? '/admin' : '/account'}
            onClick={(e) => {
              e.preventDefault();
              navigate(user?.role === 'admin' ? '/admin' : '/account');
            }}
            aria-label={user ? `Account (${user.fullName})` : 'Sign in or register'}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#E4EAE4] text-[#202820] hover:border-[#12B326] hover:text-[#12B326] transition-colors"
          >
            <User className="w-4 h-4" />
          </a>

          <a
            href="/account?tab=favorites"
            onClick={(e) => {
              e.preventDefault();
              navigate('/account?tab=favorites');
            }}
            aria-label="Saved vegetables"
            className="hidden sm:inline-flex relative items-center justify-center w-10 h-10 rounded-xl border border-[#E4EAE4] text-[#202820] hover:border-[#12B326] hover:text-[#12B326] transition-colors"
          >
            <Heart className="w-4 h-4" />
            {favCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0F5338] text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                {favCount}
              </span>
            )}
          </a>

          <button
            type="button"
            onClick={openCartDrawer}
            aria-label={`Shopping cart with ${cartSummary.totalItemCount} items`}
            className="relative inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-[#DCE8DD] bg-[#F7FBF7] text-[#0F5338] hover:border-[#12B326] hover:bg-[#EDF7EE] transition-colors"
          >
            <ShoppingBag className="w-4 h-4 shrink-0 text-[#12B326]" />
            {cartSummary.subtotalPkr !== null && cartSummary.totalItemCount > 0 && (
              <span className="hidden lg:inline text-xs font-mono font-bold text-[#1B251D] tabular-nums">
                {formatPkr(cartSummary.subtotalPkr)}
              </span>
            )}
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#12B326] text-white text-[11px] font-mono font-semibold flex items-center justify-center tabular-nums">
              {cartSummary.totalItemCount}
            </span>
          </button>

          <a
            href={cartSummary.canProceedToCheckout ? '/checkout' : '/wholesale'}
            onClick={(e) => {
              e.preventDefault();
              navigate(cartSummary.canProceedToCheckout ? '/checkout' : '/wholesale');
            }}
            className="hidden lg:inline-flex items-center justify-center h-10 px-4 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            {cartSummary.canProceedToCheckout ? 'Checkout' : 'Business Supply'}
          </a>
        </div>
      </div>

      {/* Primary Site & Category Navigation Ribbon */}
      <nav
        aria-label="Primary navigation"
        className="bg-[#0F5338] text-white border-t border-[#003B22]/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2">
          {RIBBON_ITEMS.map((item) => {
            const isSelected = activeCategory === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
                className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs sm:text-[13.5px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#12B326] text-white font-semibold'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Delivery Zone Selector Modal */}
      {zoneModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="zone-dialog-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E4EAE4] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 id="zone-dialog-title" className="text-xl sm:text-2xl font-semibold text-[#202820]">
                Select Lahore Service Area
              </h2>
              <button
                type="button"
                onClick={() => setZoneModalOpen(false)}
                aria-label="Close delivery location dialog"
                className="p-1.5 rounded-lg text-[#687268] hover:text-[#202820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#687268] mb-4 leading-relaxed">
              Fresh Farm Vegetables dispatches from Commercial CCA, Phase 6, DHA, Lahore. Select your area to check ordering and Cash on Delivery availability.
            </p>
            <div className="space-y-2">
              {settings.deliveryZones
                .filter((z) => z.enabled)
                .map((zone) => {
                  const active = zone.id === selectedZoneId;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        setSelectedZoneId(zone.id);
                        setZoneModalOpen(false);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                        active
                          ? 'border-[#12B326] bg-[#F6F8F6]'
                          : 'border-[#E4EAE4] hover:border-[#12B326]/60'
                      }`}
                    >
                      <p className="text-sm font-semibold text-[#202820]">{zone.name}</p>
                      <p className="text-xs text-[#687268] mt-0.5">
                        {zone.deliveryFeePkr !== null
                          ? `Delivery charge: ${formatPkr(zone.deliveryFeePkr)}`
                          : zone.notes}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
