import React, { useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { ProduceImage } from '../components/ProduceImage';
import { useStore } from '../context/StoreContext';
import { buildMultiItemWhatsAppUrl, formatPkr } from '../utils/commerce';

export function CartPage() {
  const {
    settings,
    cartSummary,
    selectedZoneId,
    setSelectedZoneId,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    confirmUpdatedCartPrices,
    navigate,
  } = useStore();

  useEffect(() => {
    document.title = 'Shopping Cart — Fresh Farm Vegetables';
  }, []);

  const whatsappUrl = buildMultiItemWhatsAppUrl(
    settings.whatsappIntl,
    cartSummary.items.map((i) => ({
      productName: i.product?.name || 'Produce Item',
      quantity: i.quantity,
      selectedPackage: i.selectedPackage,
    }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18261B] tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-sm text-[#5A6B5D] mt-1">
            Review selected produce packages, adjust quantities, and proceed to secure checkout.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cartSummary.items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="h-10 px-4 rounded-xl border border-[#DCE8DC] bg-white text-xs font-semibold text-[#5A6B5D] hover:text-[#E4483D] hover:border-[#E4483D]/40 transition-colors"
            >
              Clear Cart
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F5338] hover:text-[#12B326] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>

      {cartSummary.items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#DCE8DC] p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC] text-[#12B326] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[#18261B] mb-1">Your shopping cart is empty</h2>
          <p className="text-sm text-[#5A6B5D] mb-6 leading-relaxed">
            Add fresh local or imported vegetables from our catalog to calculate your PKR subtotal and place an order.
          </p>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="h-11 px-6 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold transition-colors"
          >
            Browse Produce Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cartSummary.hasPriceChanges && (
              <div className="p-4 rounded-2xl bg-[#FFF5F5] border border-[#E4483D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <AlertCircle className="w-5 h-5 text-[#E4483D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#202820]">
                      Daily market prices were updated
                    </p>
                    <p className="text-[#687268]">
                      Review the updated PKR prices below and confirm before proceeding to checkout.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={confirmUpdatedCartPrices}
                  className="h-10 px-4 rounded-xl bg-[#0F5338] hover:bg-[#003B22] text-white text-xs font-semibold shrink-0"
                >
                  Confirm Updated Prices
                </button>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-[#DCE8DC] divide-y divide-[#E4ECE4] overflow-hidden shadow-2xs">
              {cartSummary.items.map((item) => {
                const name = item.product?.name || 'Unavailable Product';
                return (
                  <div
                    key={`${item.productId}-${item.selectedPackage}`}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[#F9FBF9] transition-colors"
                  >
                    <ProduceImage
                      src={item.product?.imageUrl || ''}
                      alt={name}
                      className="w-20 h-20 rounded-2xl object-cover bg-[#F4FAF5] border border-[#DCE8DC] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <a
                        href={item.product ? `/products/${item.product.slug}` : '/products'}
                        onClick={(e) => {
                          e.preventDefault();
                          if (item.product) navigate(`/products/${item.product.slug}`);
                        }}
                        className="text-base font-bold text-[#18261B] hover:text-[#12B326] transition-colors"
                      >
                        {name}
                      </a>
                      <div className="text-xs text-[#5A6B5D] mt-1 flex flex-wrap items-center gap-2">
                        {item.product && (
                          <span className="px-2 py-0.5 rounded-md bg-[#F4FAF5] border border-[#DCE8DC] text-[#0F5338] font-medium">
                            {item.product.origin === 'local' ? 'Local Produce' : 'Imported'}
                          </span>
                        )}
                        {item.selectedPackage && (
                          <span className="px-2 py-0.5 rounded-md bg-[#F9FBF9] border border-[#E4ECE4] text-[#18261B] font-medium">
                            Package: {item.selectedPackage}
                          </span>
                        )}
                      </div>

                      {item.isUnavailable ? (
                        <p className="text-xs font-semibold text-[#E4483D] mt-1.5">
                          Currently unavailable — remove item to proceed
                        </p>
                      ) : item.isUnpriced ? (
                        <p className="text-xs font-semibold text-[#0F5338] mt-1.5">
                          Price to be confirmed
                        </p>
                      ) : (
                        <p className="text-xs font-mono text-[#5A6B5D] mt-1.5 tabular-nums">
                          Unit Price: {formatPkr(item.unitPricePkr!)}
                        </p>
                      )}
                    </div>

                    {/* Quantity Stepper + Line Total + Remove */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E4ECE4]">
                      <div className="inline-flex items-center h-10 rounded-xl border border-[#DCE8DC] bg-[#F4FAF5] shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.selectedPackage,
                              item.quantity - 1
                            )
                          }
                          aria-label={`Decrease quantity of ${name}`}
                          className="w-9 h-full flex items-center justify-center text-[#18261B] hover:text-[#12B326]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-mono font-bold text-[#18261B] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.selectedPackage,
                              item.quantity + 1
                            )
                          }
                          aria-label={`Increase quantity of ${name}`}
                          className="w-9 h-full flex items-center justify-center text-[#18261B] hover:text-[#12B326]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[88px] sm:min-w-[105px]">
                        {item.lineTotalPkr !== null ? (
                          <span className="text-sm sm:text-base font-mono font-bold text-[#0F5338] tabular-nums">
                            {formatPkr(item.lineTotalPkr)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-[#5A6B5D]">
                            Quote required
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.selectedPackage)}
                        aria-label={`Remove ${name}`}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[#687268] hover:text-[#E4483D] hover:bg-[#FFF5F5] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#DCE8DC] p-6 space-y-5 shadow-2xs lg:sticky lg:top-32">
            <h2 className="text-lg font-bold text-[#18261B]">Order Summary</h2>

            {/* Delivery Zone Estimate Selector */}
            <div className="p-3.5 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC] space-y-2">
              <label
                htmlFor="cart-zone-select"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0F5338]"
              >
                <MapPin className="w-3.5 h-3.5 text-[#12B326]" />
                <span>Lahore Delivery Area</span>
              </label>
              <select
                id="cart-zone-select"
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#DCE8DC] text-xs font-medium text-[#18261B] focus:border-[#12B326] focus:outline-none"
              >
                {settings.deliveryZones
                  .filter((z) => z.enabled)
                  .map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}{' '}
                      {z.deliveryFeePkr !== null
                        ? `(${formatPkr(z.deliveryFeePkr)})`
                        : '(Confirmed by team)'}
                    </option>
                  ))}
              </select>
            </div>

            {cartSummary.hasUnpricedItems ? (
              <div className="p-4 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC] space-y-2 text-xs leading-relaxed">
                <p className="font-semibold text-[#0F5338]">Rate Confirmation Required</p>
                <p className="text-[#5A6B5D]">
                  Because your cart includes produce marked &quot;Price to be confirmed,&quot; submit your cart as a quote inquiry to receive today&apos;s confirmed PKR rates.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#5A6B5D]">
                  <span>Subtotal ({cartSummary.totalItemCount} items)</span>
                  <span className="font-mono font-semibold text-[#18261B] tabular-nums">
                    {cartSummary.subtotalPkr !== null ? formatPkr(cartSummary.subtotalPkr) : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-[#5A6B5D]">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-xs sm:text-sm text-[#18261B] tabular-nums">
                    {cartSummary.deliveryPendingConfirmation
                      ? 'Confirmed by team'
                      : formatPkr(cartSummary.deliveryFeePkr || 0)}
                  </span>
                </div>
                {settings.taxRatePercent > 0 && cartSummary.taxPkr !== null && (
                  <div className="flex justify-between text-[#5A6B5D]">
                    <span>Applicable Tax ({settings.taxRatePercent}%)</span>
                    <span className="font-mono tabular-nums">{formatPkr(cartSummary.taxPkr)}</span>
                  </div>
                )}
                {cartSummary.grandTotalPkr !== null && (
                  <div className="pt-3 border-t border-[#DCE8DC] flex justify-between items-baseline">
                    <span className="text-base font-bold text-[#18261B]">Order Total</span>
                    <span className="text-lg font-mono font-bold text-[#0F5338] tabular-nums">
                      {formatPkr(cartSummary.grandTotalPkr)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {cartSummary.hasUnpricedItems ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => navigate('/wholesale?from=cart')}
                  className="w-full h-12 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold transition-colors"
                >
                  Request Current Prices
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-2xl border border-[#0F5338] text-[#0F5338] hover:bg-[#0F5338] hover:text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Cart via WhatsApp</span>
                </a>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={!cartSummary.canProceedToCheckout}
                  onClick={() => navigate('/checkout')}
                  className="w-full h-12 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] disabled:bg-[#DCE8DC] disabled:text-[#687268] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/wholesale?from=cart')}
                  className="w-full min-h-11 py-2.5 px-4 rounded-2xl border border-[#DCE8DC] hover:border-[#0F5338] text-[#18261B] text-xs font-semibold leading-snug transition-colors"
                >
                  Need Recurring Wholesale Rates? Request Quote
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#E4ECE4] flex items-start gap-2 text-[11px] text-[#5A6B5D] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#12B326] shrink-0 mt-0.5" />
              <span>
                Pay via QR Code / Official Account Transfer or Cash on Delivery. All online transfers are verified prior to payment confirmation.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
