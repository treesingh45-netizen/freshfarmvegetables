import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Info,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { ProduceImage } from '../components/ProduceImage';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import {
  buildProductWhatsAppUrl,
  formatPkr,
  resolvePackageUnitPricePkr,
} from '../utils/commerce';

export function ProductDetailPage({ slug }: { slug: string }) {
  const { products, settings, user, addToCart, toggleFavorite, navigate } = useStore();

  const product = useMemo(
    () => products.find((p) => p.slug === slug && p.enabled) || null,
    [products, slug]
  );

  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedPkg, setSelectedPkg] = useState('');

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — Fresh Farm Vegetables Lahore`;
      setSelectedImage(product.imageUrl);
      setSelectedPkg(product.packageOptions[0] || '');
      setQuantity(1);
    }
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.enabled && p.id !== product.id && p.origin === product.origin)
      .slice(0, 6);
  }, [products, product]);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#202820] mb-3">
          Product Not Found
        </h1>
        <p className="text-sm text-[#687268] mb-6">
          This vegetable may have been disabled or moved in our catalog.
        </p>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="h-11 px-6 rounded-xl bg-[#12B326] text-white text-sm font-semibold"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const resolvedPkgPrice = resolvePackageUnitPricePkr(product, selectedPkg);
  const hasLivePrice = resolvedPkgPrice !== null && resolvedPkgPrice > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const isFavorite = Boolean(user?.favoriteProductIds?.includes(product.id));

  const whatsappUrl = buildProductWhatsAppUrl(settings.whatsappIntl, product.name, {
    quantity,
    selectedPackage: selectedPkg,
  });

  const gallery =
    product.galleryUrls && product.galleryUrls.length > 0
      ? product.galleryUrls
      : [product.imageUrl];

  // Authentic Product JSON-LD (no fabricated ratings or prices)
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: settings.businessName,
    },
    category: product.origin === 'local' ? 'Fresh Local Produce' : 'Imported Vegetables',
  };

  if (hasLivePrice) {
    structuredData.offers = {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: product.pricePkr,
      availability:
        product.stockStatus === 'out_of_stock'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    };
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumb Back Navigation */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-[#687268]">
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 font-medium text-[#0F5338] hover:text-[#12B326] transition-colors whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>All Products</span>
        </button>
        <span aria-hidden="true">/</span>
        <button
          type="button"
          onClick={() => navigate(`/products?category=${product.origin}`)}
          className="hover:text-[#202820] whitespace-nowrap shrink-0"
        >
          {product.origin === 'local' ? 'Fresh Local Produce' : 'Imported Vegetables'}
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-[#202820] font-medium truncate max-w-[220px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-white border border-[#E4EAE4]">
            <ProduceImage
              src={selectedImage || product.imageUrl}
              alt={`${product.name} — Fresh Farm Vegetables Lahore`}
              eager
              className="w-full h-full object-cover"
            />
          </div>

          {gallery.length > 1 && (
            <div className="flex items-center gap-3">
              {gallery.map((imgUrl) => (
                <button
                  key={imgUrl}
                  type="button"
                  onClick={() => setSelectedImage(imgUrl)}
                  aria-label={`View image of ${product.name}`}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    selectedImage === imgUrl ? 'border-[#12B326]' : 'border-[#E4EAE4]'
                  }`}
                >
                  <ProduceImage src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#687268]">
                <span className="font-semibold text-[#0F5338]">
                  {product.origin === 'local' ? 'Fresh Local Produce' : 'Imported Vegetable'}
                </span>
                {product.isSpecialty && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#12B326]">
                      Primary House Specialty
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label={isFavorite ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                  isFavorite
                    ? 'border-[#E4483D] text-[#E4483D] bg-[#FFF5F5]'
                    : 'border-[#E4EAE4] text-[#687268] hover:text-[#202820]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 shrink-0 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.7rem] font-semibold text-[#202820] tracking-[-0.015em] leading-[1.1]">
              {product.name}
            </h1>
            <p className="font-signature text-2xl text-[#12B326] mt-1 py-0.5">
              Hand-selected for kitchen freshness
            </p>
          </div>

          {/* Pricing & Verified Stock */}
          <div className="py-4 border-y border-[#E4EAE4] flex flex-wrap items-baseline justify-between gap-4">
            {hasLivePrice ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-[#202820] tabular-nums">
                    {formatPkr(resolvedPkgPrice!)}
                  </span>
                  <span className="text-sm text-[#687268]">
                    {selectedPkg ? `(${selectedPkg})` : product.priceUnit}
                  </span>
                </div>
                {product.priceUpdatedAt && (
                  <p className="text-xs text-[#687268] mt-1">
                    Confirmed market rate updated{' '}
                    {new Date(product.priceUpdatedAt).toLocaleDateString('en-PK')}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xl font-bold text-[#0F5338]">Request Today's Rate</p>
                <p className="text-xs text-[#687268] mt-0.5">
                  Add to your inquiry cart or message on WhatsApp for today's confirmed PKR rate
                </p>
              </div>
            )}

            {product.stockStatus !== 'unverified' && (
              <span
                className={`text-xs font-semibold ${
                  product.stockStatus === 'out_of_stock'
                    ? 'text-[#E4483D]'
                    : 'text-[#12B326]'
                }`}
              >
                {product.stockStatus === 'in_stock'
                  ? 'Verified In Stock'
                  : product.stockStatus === 'limited'
                  ? 'Limited Daily Allocation'
                  : 'Currently Out of Stock'}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base text-[#202820] leading-relaxed">
            {product.description}
          </p>

          {/* Package Options (when configured) */}
          {product.packageOptions.length > 0 && (
            <div>
              <label
                htmlFor="detail-pkg-select"
                className="block text-xs font-semibold text-[#202820] mb-2"
              >
                Select Package / Weight Option
              </label>
              <div className="flex flex-wrap gap-2" id="detail-pkg-select">
                {product.packageOptions.map((pkg) => (
                  <button
                    key={pkg}
                    type="button"
                    onClick={() => setSelectedPkg(pkg)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-colors ${
                      selectedPkg === pkg
                        ? 'border-[#12B326] bg-[#12B326] text-white'
                        : 'border-[#E4EAE4] bg-[#F6F8F6] text-[#202820] hover:border-[#12B326]'
                    }`}
                  >
                    {pkg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Actions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="inline-flex items-center justify-between h-12 px-2 rounded-xl border border-[#E4EAE4] bg-[#F6F8F6] sm:w-36 shrink-0">
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#202820] hover:bg-white disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-mono font-bold text-[#202820] tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#202820] hover:bg-white disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => addToCart(product, quantity, selectedPkg, true)}
                className={`flex-1 h-12 px-6 rounded-xl text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                  isOutOfStock
                    ? 'bg-[#E4EAE4] text-[#687268] cursor-not-allowed'
                    : hasLivePrice
                    ? 'bg-[#12B326] hover:bg-[#0F5338] text-white'
                    : 'bg-[#0F5338] hover:bg-[#003B22] text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {hasLivePrice ? 'Add to Cart' : 'Add to Rate Inquiry'}
                </span>
              </button>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-11 py-2.5 px-4 sm:px-5 rounded-xl border border-[#0F5338] text-[#0F5338] hover:bg-[#0F5338] hover:text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 text-center transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Inquire About Today&apos;s Rate on WhatsApp</span>
            </a>
          </div>

          {/* Culinary & Storage Info */}
          <div className="pt-4 border-t border-[#E4EAE4] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-[#202820] mb-1">Kitchen Applications</p>
              <p className="text-[#687268] leading-relaxed">{product.culinaryApplications}</p>
            </div>
            <div>
              <p className="font-semibold text-[#202820] mb-1">Storage &amp; Handling</p>
              <p className="text-[#687268] leading-relaxed">{product.handlingNotes}</p>
            </div>
          </div>

          {/* Mandatory Daily Market Rate Notice */}
          <div className="p-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] flex items-start gap-2.5 text-xs text-[#687268] leading-relaxed">
            <Info className="w-4 h-4 text-[#0F5338] shrink-0 mt-0.5" />
            <span>
              Vegetable rates may vary daily according to market conditions. Contact us to confirm today's price and availability.
            </span>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-[#E4EAE4]">
          <div className="mb-6">
            <p className="font-signature text-2xl text-[#12B326] py-0.5">
              More from Our Harvest
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#202820] tracking-[-0.015em] leading-[1.14]">
              Related {product.origin === 'local' ? 'Local Produce' : 'Imported Vegetables'}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
