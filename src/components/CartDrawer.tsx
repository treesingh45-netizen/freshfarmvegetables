import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { buildMultiItemWhatsAppUrl, formatPkr } from '../utils/commerce';
import { ProduceImage } from './ProduceImage';

export function CartDrawer() {
  const {
    settings,
    cartSummary,
    isCartDrawerOpen,
    closeCartDrawer,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    confirmUpdatedCartPrices,
    navigate,
  } = useStore();

  if (!isCartDrawerOpen) return null;

  const whatsappCartUrl = buildMultiItemWhatsAppUrl(
    settings.whatsappIntl,
    cartSummary.items.map((item) => ({
      productName: item.product?.name || 'Produce Item',
      quantity: item.quantity,
      selectedPackage: item.selectedPackage,
    }))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0F2419]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="fixed inset-0" onClick={closeCartDrawer} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[430px] bg-white h-full flex flex-col shadow-2xl sm:rounded-l-3xl border-l border-[#DCE8DC] overflow-hidden">
        {/* Slide-Over Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#F4FAF5] border-b border-[#DCE8DC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#12B326]/15 text-[#0F5338] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cart-drawer-title" className="text-base sm:text-lg font-bold text-[#18261B]">
                Shopping Cart
              </h2>
              <p className="text-xs text-[#5A6B5D] tabular-nums">
                {cartSummary.totalItemCount}{' '}
                {cartSummary.totalItemCount === 1 ? 'item selected' : 'items selected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {cartSummary.items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="h-8 px-2.5 rounded-lg text-xs font-semibold text-[#5A6B5D] hover:text-[#E4483D] hover:bg-white transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={closeCartDrawer}
              aria-label="Close shopping cart"
              className="w-9 h-9 rounded-xl bg-white border border-[#DCE8DC] flex items-center justify-center text-[#5A6B5D] hover:text-[#18261B] hover:border-[#12B326] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Daily Price Change Alert */}
        {cartSummary.hasPriceChanges && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-[#FFF5F5] border border-[#E4483D]/30 text-xs text-[#202820]">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#E4483D] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Market rates were updated</p>
                <p className="text-[#687268] mt-0.5">
                  One or more items in your cart had a daily rate update. Confirm the latest PKR prices to proceed.
                </p>
                <button
                  type="button"
                  onClick={confirmUpdatedCartPrices}
                  className="mt-2.5 h-8 px-3.5 rounded-xl bg-[#0F5338] text-white font-semibold hover:bg-[#003B22] transition-colors"
                >
                  Confirm Updated Prices
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartSummary.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC] text-[#12B326] flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-[#18261B] mb-1">
                Your shopping cart is empty
              </p>
              <p className="text-sm text-[#5A6B5D] max-w-xs mb-6 leading-relaxed">
                Add fresh local and imported vegetables from our catalog to calculate your PKR order total.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCartDrawer();
                  navigate('/products');
                }}
                className="h-11 px-6 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold transition-colors"
              >
                Browse Produce Catalog
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {cartSummary.items.map((item) => {
                const prodName = item.product?.name || 'Unavailable Product';
                return (
                  <li
                    key={`${item.productId}-${item.selectedPackage}`}
                    className="p-3.5 rounded-2xl bg-[#F9FBF9] border border-[#E4ECE4] flex gap-3.5 transition-colors hover:border-[#C5DEC7]"
                  >
                    <ProduceImage
                      src={item.product?.imageUrl || ''}
                      alt={prodName}
                      className="w-16 h-16 rounded-xl object-cover bg-white border border-[#E4ECE4] shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-[#18261B] truncate">
                            {prodName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {item.selectedPackage && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-[#DCE8DC] text-[11px] font-medium text-[#0F5338]">
                                {item.selectedPackage}
                              </span>
                            )}
                            {!item.isUnavailable && !item.isUnpriced && item.unitPricePkr !== null && (
                              <span className="text-[11px] font-mono text-[#5A6B5D] tabular-nums">
                                {formatPkr(item.unitPricePkr)} each
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId, item.selectedPackage)}
                          aria-label={`Remove ${prodName} from cart`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#687268] hover:text-[#E4483D] hover:bg-[#FFF5F5] transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.isUnavailable ? (
                        <p className="text-xs font-medium text-[#E4483D] mt-1.5">
                          Currently unavailable — please remove
                        </p>
                      ) : item.isUnpriced ? (
                        <p className="text-xs font-medium text-[#0F5338] mt-1.5">
                          Price to be confirmed
                        </p>
                      ) : (
                        item.priceChanged &&
                        item.previousPricePkr !== null && (
                          <p className="text-[11px] text-[#E4483D] font-medium mt-1">
                            Updated from {formatPkr(item.previousPricePkr)}
                          </p>
                        )
                      )}

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center h-8 rounded-xl border border-[#DCE8DC] bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.productId,
                                item.selectedPackage,
                                item.quantity - 1
                              )
                            }
                            aria-label={`Decrease quantity of ${prodName}`}
                            className="w-8 h-full flex items-center justify-center text-[#18261B] hover:text-[#12B326] transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-[#18261B] tabular-nums">
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
                            aria-label={`Increase quantity of ${prodName}`}
                            className="w-8 h-full flex items-center justify-center text-[#18261B] hover:text-[#12B326] transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.lineTotalPkr !== null ? (
                          <span className="text-sm font-mono font-bold text-[#0F5338] tabular-nums">
                            {formatPkr(item.lineTotalPkr)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-[#5A6B5D]">Rate inquiry</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Slide-Over Footer with Calculated Subtotal + Checkout & View Cart Buttons */}
        {cartSummary.items.length > 0 && (
          <div className="border-t border-[#DCE8DC] p-5 bg-[#F4FAF5] space-y-4">
            {cartSummary.hasUnpricedItems ? (
              <div className="p-3.5 rounded-2xl bg-white border border-[#DCE8DC] text-xs text-[#202820] leading-relaxed">
                <p className="font-semibold text-[#0F5338]">Rate Confirmation Mode</p>
                <p className="text-[#5A6B5D] mt-0.5">
                  One or more items require today&apos;s rate confirmation. Request confirmed PKR rates or message us on WhatsApp.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white border border-[#DCE8DC] space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#5A6B5D]">Subtotal</span>
                  <span
                    data-testid="cart-drawer-subtotal"
                    className="text-base font-mono font-bold text-[#18261B] tabular-nums"
                  >
                    {cartSummary.subtotalPkr !== null ? formatPkr(cartSummary.subtotalPkr) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5A6B5D]">
                  <span>Lahore Delivery</span>
                  <span className="font-mono tabular-nums">
                    {cartSummary.deliveryPendingConfirmation
                      ? 'Calculated at checkout'
                      : formatPkr(cartSummary.deliveryFeePkr || 0)}
                  </span>
                </div>
              </div>
            )}

            {cartSummary.hasUnpricedItems ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    closeCartDrawer();
                    navigate('/cart');
                  }}
                  className="h-11 px-4 rounded-2xl border border-[#DCE8DC] bg-white text-[#18261B] hover:border-[#12B326] text-sm font-semibold transition-colors"
                >
                  View Cart
                </button>
                <a
                  href={whatsappCartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-4 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Quote</span>
                </a>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={!cartSummary.canProceedToCheckout}
                  onClick={() => {
                    closeCartDrawer();
                    navigate('/checkout');
                  }}
                  className="w-full h-12 px-5 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] disabled:bg-[#DCE8DC] disabled:text-[#687268] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeCartDrawer();
                    navigate('/cart');
                  }}
                  className="w-full h-11 px-5 rounded-2xl border border-[#C5DEC7] bg-white hover:bg-[#EBF6EC] hover:border-[#12B326] text-[#0F5338] text-sm font-semibold transition-colors"
                >
                  View Cart
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
