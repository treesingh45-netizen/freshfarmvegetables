import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { CatalogCategorySlug, ProduceOrigin } from '../types';
import { filterAndSortProducts, ProductFilterOptions } from '../utils/commerce';

const CATEGORY_TABS: {
  slug: CatalogCategorySlug;
  label: string;
  heading: string;
  subtitle: string;
}[] = [
  {
    slug: 'all',
    label: 'All Products',
    heading: 'Complete Produce Catalog',
    subtitle:
      'Fresh local produce, imported vegetables, and house-specialty iceberg and vacuum-packed lettuce. Vegetable rates fluctuate daily according to market conditions.',
  },
  {
    slug: 'local',
    label: 'Fresh Local Produce',
    heading: 'Fresh Local Vegetables',
    subtitle:
      'Everyday farm-fresh vegetables selected each morning for commercial kitchens, restaurants, and households in Lahore.',
  },
  {
    slug: 'imported',
    label: 'Imported Vegetables',
    heading: 'Imported Culinary Vegetables',
    subtitle:
      'Specialty imported vegetables, coloured capsicums, mushrooms, broccoli, and culinary greens for continental and hospitality menus.',
  },
  {
    slug: 'iceberg-lettuce',
    label: 'Iceberg Lettuce',
    heading: 'Fresh Iceberg Lettuce',
    subtitle:
      'Crisp, tightly-headed iceberg lettuce harvested and trimmed for restaurants, burger kitchens, cafés, and salad prep stations.',
  },
  {
    slug: 'vacuum-packed-lettuce',
    label: 'Vacuum-Packed Lettuce',
    heading: 'Vacuum-Packed Lettuce',
    subtitle:
      'Hygienically vacuum-sealed lettuce engineered for extended cold-room freshness and consistent commercial kitchen prep.',
  },
  {
    slug: 'lettuce-collection',
    label: 'Lettuce Collection',
    heading: 'Specialty Lettuce Collection',
    subtitle:
      'Our signature iceberg, vacuum-packed, romaine, and lolo rose lettuce varieties curated for chefs and hospitality teams.',
  },
  {
    slug: 'bestsellers',
    label: 'Bestsellers',
    heading: 'Kitchen Bestsellers',
    subtitle:
      'Our most frequently ordered fresh vegetables across Lahore restaurants, hotels, cafés, and households.',
  },
];

export function CatalogPage() {
  const { products, settings, currentSearch, navigate } = useStore();

  const urlParams = useMemo(() => new URLSearchParams(currentSearch), [currentSearch]);
  const initialCategory = (urlParams.get('category') as CatalogCategorySlug) || 'all';
  const initialOrigin = (urlParams.get('origin') as 'all' | ProduceOrigin) || 'all';
  const initialQ = urlParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [category, setCategory] = useState<CatalogCategorySlug>(initialCategory);
  const [origin, setOrigin] = useState<'all' | ProduceOrigin>(initialOrigin);
  const [sortBy, setSortBy] = useState<NonNullable<ProductFilterOptions['sortBy']>>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setCategory(initialCategory);
    setOrigin(initialOrigin);
    setSearchQuery(initialQ);
  }, [initialCategory, initialOrigin, initialQ]);

  useEffect(() => {
    const activeTab = CATEGORY_TABS.find((t) => t.slug === category);
    document.title = `${activeTab ? activeTab.label : 'Catalog'} — Fresh Farm Vegetables Lahore`;
  }, [category]);

  const anyLiveInventoryConfigured = useMemo(
    () => products.some((p) => p.enabled && p.stockStatus !== 'unverified'),
    [products]
  );

  const anyLivePricesConfigured = useMemo(
    () => products.some((p) => p.enabled && p.pricingMode === 'live' && p.pricePkr !== null),
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(products, {
        searchQuery,
        origin,
        category,
        sortBy,
        inStockOnly: anyLiveInventoryConfigured ? inStockOnly : false,
      }),
    [products, searchQuery, origin, category, sortBy, inStockOnly, anyLiveInventoryConfigured]
  );

  const handleCategoryChange = (nextCat: CatalogCategorySlug) => {
    setCategory(nextCat);
    const nextParams = new URLSearchParams();
    if (nextCat !== 'all') nextParams.set('category', nextCat);
    if (searchQuery.trim()) nextParams.set('q', searchQuery.trim());
    const qs = nextParams.toString();
    navigate(qs ? `/products?${qs}` : '/products');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setOrigin('all');
    setSortBy('featured');
    setInStockOnly(false);
    navigate('/products');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    category !== 'all' ||
    origin !== 'all' ||
    sortBy !== 'featured' ||
    inStockOnly;

  const activeCategoryMeta =
    CATEGORY_TABS.find((t) => t.slug === category) || CATEGORY_TABS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Editorial Page & Product-Category Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-signature text-2xl sm:text-[1.8rem] text-[#12B326] py-0.5">
            Harvested Fresh Daily
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0F5338] mb-1">
            Fresh Farm Vegetables · <span className="whitespace-nowrap">DHA Phase 6, Lahore</span>
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.95rem] font-semibold text-[#202820] tracking-[-0.015em] leading-[1.1]">
            {activeCategoryMeta.heading}
          </h1>
          <p className="text-sm sm:text-base text-[#687268] leading-relaxed mt-2.5">
            {activeCategoryMeta.subtitle}
          </p>
        </div>
        {settings.lastDailyRatesPublishedAt && (
          <p className="text-xs text-[#687268] font-mono tabular-nums shrink-0">
            Rates updated: {new Date(settings.lastDailyRatesPublishedAt).toLocaleDateString('en-PK')}
          </p>
        )}
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-5">
        {CATEGORY_TABS.map((tab) => {
          const active = category === tab.slug;
          return (
            <button
              key={tab.slug}
              type="button"
              onClick={() => handleCategoryChange(tab.slug)}
              className={`h-9 px-4 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-[#12B326] text-white font-semibold'
                  : 'bg-white border border-[#E4EAE4] text-[#202820] hover:border-[#12B326]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter & Sort Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E4EAE4] p-4 mb-8 flex flex-col lg:flex-row items-stretch lg:items-center gap-3.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#687268] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter catalog by vegetable name..."
            aria-label="Filter catalog by vegetable name"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm text-[#202820] focus:bg-white focus:border-[#12B326] focus:outline-none"
          />
        </div>

        {/* Origin Filter */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] self-start lg:self-auto">
          {(
            [
              { val: 'all', label: 'All Origins' },
              { val: 'local', label: 'Local' },
              { val: 'imported', label: 'Imported' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setOrigin(opt.val)}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                origin === opt.val
                  ? 'bg-white text-[#202820] font-semibold shadow-2xs'
                  : 'text-[#687268] hover:text-[#202820]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Live Stock Filter (shown when live inventory is configured) */}
        {anyLiveInventoryConfigured && (
          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#202820] px-2 cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-[#E4EAE4] text-[#12B326] focus:ring-[#12B326]"
            />
            <span>Verified In Stock Only</span>
          </label>
        )}

        {/* Sort Select */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#687268] shrink-0 hidden sm:block" />
          <label htmlFor="catalog-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="catalog-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as NonNullable<ProductFilterOptions['sortBy']>)}
            className="flex-1 sm:flex-initial h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-xs sm:text-sm text-[#202820] focus:outline-none focus:border-[#12B326]"
          >
            <option value="featured">Sort: Featured &amp; Specialties</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            {anyLivePricesConfigured && (
              <>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </>
            )}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="h-10 px-3 rounded-xl border border-[#E4EAE4] text-xs font-semibold text-[#687268] hover:text-[#202820] hover:border-[#202820] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#687268] mb-5">
        <span className="tabular-nums">
          Showing <strong className="text-[#202820]">{filteredProducts.length}</strong>{' '}
          {filteredProducts.length === 1 ? 'vegetable' : 'vegetables'}
        </span>
        <button
          type="button"
          onClick={() => navigate('/wholesale')}
          className="text-[#0F5338] font-semibold hover:underline text-left sm:text-right"
        >
          Ordering for a restaurant or hotel? Request business supply rates
        </button>
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E4EAE4] p-10 sm:p-14 text-center max-w-xl mx-auto my-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#202820] mb-2">
            No matching vegetables found
          </h2>
          <p className="text-sm text-[#687268] mb-6 leading-relaxed">
            We could not find produce matching your current search or filter selection. Reset your filters to view all 28 local and imported vegetables, or send us a direct inquiry.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={clearAllFilters}
              className="h-10 px-5 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold transition-colors"
            >
              Reset All Filters
            </button>
            <button
              type="button"
              onClick={() => navigate('/wholesale')}
              className="h-10 px-5 rounded-xl border border-[#E4EAE4] text-sm font-semibold text-[#202820] hover:border-[#12B326] transition-colors"
            >
              Custom Produce Inquiry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
