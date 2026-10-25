import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Minus, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { buildProductWhatsAppUrl, formatRs, resolvePackageUnitPricePkr } from '../utils/commerce';
import { ProduceImage } from './ProduceImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const {
    settings,
    user,
    cartItems,
    addToCart,
    updateCartQuantity,
    toggleFavorite,
    navigate,
  } = useStore();

  const [selectedPkg, setSelectedPkg] = useState(product.packageOptions[0] || '');

  useEffect(() => {
    if (!selectedPkg && product.packageOptions.length > 0) {
      setSelectedPkg(product.packageOptions[0]);
    } else if (
      selectedPkg &&
      product.packageOptions.length > 0 &&
      !product.packageOptions.includes(selectedPkg)
    ) {
      setSelectedPkg(product.packageOptions[0]);
    }
  }, [product.packageOptions, selectedPkg]);

  const isFavorite = Boolean(user?.favoriteProductIds?.includes(product.id));
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const resolvedPricePkr = resolvePackageUnitPricePkr(product, selectedPkg);
  const hasLivePrice = resolvedPricePkr !== null && resolvedPricePkr > 0;

  const matchingCartItem = cartItems.find(
    (item) => item.productId === product.id && item.selectedPackage === selectedPkg
  );
  const inCartQty = matchingCartItem ? matchingCartItem.quantity : 0;

  const whatsappUrl = buildProductWhatsAppUrl(settings.whatsappIntl, product.name, {
    quantity: inCartQty > 0 ? inCartQty : 1,
    selectedPackage: selectedPkg,
  });

  const originStatusText =
    product.stockStatus === 'out_of_stock'
      ? 'Currently Out of Stock'
      : product.stockStatus === 'limited'
      ? 'Limited Supply'
      : product.isSpecialty
      ? 'Specialty Lettuce'
      : product.origin === 'local'
      ? 'Fresh Local Produce'
      : 'Imported Produce';

  return (
    <div className="drop-shadow-[0_2px_9px_rgba(16,32,20,0.055)] hover:drop-shadow-[0_6px_16px_rgba(15,83,56,0.10)] transition-[filter,transform] duration-150 hover:-translate-y-0.5 flex flex-col h-full">
      <article className="group ffv-card-shell flex flex-col flex-1 bg-white rounded-t-xl overflow-hidden text-center">
        {/* Centered Clean White Image Area */}
        <div className="relative pt-3.5 px-3 pb-1.5 bg-white">
          <a
            href={`/products/${product.slug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/products/${product.slug}`);
            }}
            className="block aspect-4/3 w-full rounded-lg overflow-hidden bg-white"
          >
            <ProduceImage
              src={product.imageUrl}
              alt={`${product.name} — ${
                product.origin === 'local' ? 'Fresh Local Produce' : 'Imported Vegetable'
              } in Lahore`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Inquire about ${product.name} on WhatsApp`}
            title="Ask today's rate on WhatsApp"
            className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-white/92 text-[#687268] hover:text-[#12B326] border border-[#EAEFEA] flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            aria-label={isFavorite ? `Remove ${product.name} from saved` : `Save ${product.name}`}
            className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center border transition-opacity ${
              isFavorite
                ? 'bg-[#E4483D] border-[#E4483D] text-white opacity-100'
                : 'bg-white/92 border-[#EAEFEA] text-[#687268] hover:text-[#E4483D] opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Centered Card Body */}
        <div className="flex flex-col flex-1 items-center px-3 pt-1.5 pb-4">
          {/* Product Title */}
          <h3 className="w-full text-[13.5px] font-semibold text-[#1F2721] leading-snug line-clamp-2 min-h-[2.35rem] flex items-center justify-center text-balance">
            <a
              href={`/products/${product.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/products/${product.slug}`);
              }}
              className="hover:text-[#12B326] transition-colors"
            >
              {product.name}
            </a>
          </h3>

          {/* Interactive Weight / Package Selector Buttons */}
          <div className="min-h-[28px] flex flex-wrap items-center justify-center gap-1 mt-2 mb-1.5">
            {product.packageOptions.map((opt) => {
              const selected = selectedPkg === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedPkg(opt)}
                  aria-pressed={selected}
                  className={`px-2 py-0.5 rounded-full text-[11px] leading-5 whitespace-nowrap transition-colors ${
                    selected
                      ? 'bg-[#E7F4E9] text-[#0F5338] font-semibold ring-1 ring-[#12B326]/45'
                      : 'bg-[#F0F4F7] text-[#28322A] hover:bg-[#E4ECF1] font-normal'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Authentic Origin / Availability Line */}
          <p
            className={`text-[11px] leading-tight mt-1 truncate max-w-full ${
              product.stockStatus === 'out_of_stock'
                ? 'text-[#E4483D] font-medium'
                : product.isSpecialty
                ? 'text-[#129A25] font-medium'
                : 'text-[#768278]'
            }`}
          >
            {originStatusText}
          </p>

          {/* Bold Centered Price / Rate */}
          <div className="mt-1 mb-3 min-h-[24px] flex items-center justify-center">
            {hasLivePrice ? (
              <span className="text-[15.5px] font-bold text-[#1D241E] tabular-nums tracking-tight">
                {formatRs(resolvedPricePkr!)}
              </span>
            ) : (
              <span className="text-[14px] font-bold text-[#1D241E] tracking-tight">
                Request Rate
              </span>
            )}
          </div>

          {/* Signature Pale-Sage Chevron Action Bar */}
          <div className="mt-auto w-full px-1">
            {inCartQty > 0 && !isOutOfStock ? (
              <div className="ffv-add-chevron w-full h-11 bg-[#E1EFD7] text-[#1E6B30] flex items-center justify-between px-3 pt-1">
                <button
                  type="button"
                  onClick={() => updateCartQuantity(product.id, selectedPkg, inCartQty - 1)}
                  aria-label={`Decrease quantity for ${product.name}`}
                  className="w-8 h-8 rounded-full hover:bg-white/70 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span className="text-xs font-mono font-bold text-[#1A241B] tabular-nums">
                  {inCartQty}
                </span>
                <button
                  type="button"
                  onClick={() => updateCartQuantity(product.id, selectedPkg, inCartQty + 1)}
                  aria-label={`Increase quantity for ${product.name}`}
                  className="w-8 h-8 rounded-full hover:bg-white/70 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => addToCart(product, 1, selectedPkg, true)}
                aria-label={
                  hasLivePrice
                    ? `Add ${product.name} to cart`
                    : `Request price for ${product.name}`
                }
                className={`ffv-add-chevron w-full h-11 pt-1 flex items-center justify-center transition-colors ${
                  isOutOfStock
                    ? 'bg-[#EEF1EE] text-[#9AA39B] cursor-not-allowed'
                    : 'bg-[#ECF3E5] hover:bg-[#DFEDD5] text-[#287D3C]'
                }`}
              >
                <Plus className="w-5 h-5 stroke-[2.6]" />
              </button>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
