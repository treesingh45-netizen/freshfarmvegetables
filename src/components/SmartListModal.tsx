import React, { useState } from 'react';
import { Check, ClipboardList, Loader2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function SmartListModal() {
  const { products, isSmartListOpen, closeSmartList, addToCart, openCartDrawer } = useStore();
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<
    { productId: string; productName: string; quantity: number; unitOrPackage: string }[] | null
  >(null);
  const [unmatched, setUnmatched] = useState<string[]>([]);

  if (!isSmartListOpen) return null;

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setError('Paste or enter at least one vegetable and quantity.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/quick-order-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not parse list.');
      }
      setParsed(data.matchedItems || []);
      setUnmatched(data.unmatchedNotes || []);
    } catch (err: any) {
      setError(err.message || 'Unable to parse list automatically.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAll = () => {
    if (!parsed) return;
    const prodMap = new Map(products.map((p) => [p.id, p]));
    for (const item of parsed) {
      const prod = prodMap.get(item.productId);
      if (prod) {
        addToCart(prod, item.quantity, item.unitOrPackage, false);
      }
    }
    closeSmartList();
    setParsed(null);
    setRawText('');
    openCartDrawer();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-list-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E4EAE4] shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#12B326]" />
            <h2 id="smart-list-title" className="text-lg font-bold text-[#202820]">
              Quick Kitchen Order List
            </h2>
          </div>
          <button
            type="button"
            onClick={closeSmartList}
            aria-label="Close quick list modal"
            className="p-1.5 rounded-lg text-[#687268] hover:text-[#202820]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#687268] mb-4 leading-relaxed">
          Paste your daily kitchen requirement list (for example: "12 iceberg lettuce, 5 vacuum-packed lettuce, 10 kg tomatoes, 3 kg mushrooms") to match items straight to our catalog.
        </p>

        <form onSubmit={handleParse} className="space-y-3">
          <textarea
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="15 Iceberg Lettuce&#10;6 Vacuum-Packed Lettuce&#10;10 kg Tomatoes&#10;3 kg Cherry Tomatoes"
            aria-label="Paste vegetable order list"
            className="w-full p-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm text-[#202820] focus:bg-white focus:border-[#12B326] focus:outline-none"
          />

          {error && <p className="text-xs font-medium text-[#E4483D]">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setRawText('12 Iceberg Lettuce, 6 Vacuum-Packed Lettuce, 10 kg Tomatoes, 3 kg Broccoli')
              }
              className="text-xs text-[#0F5338] hover:underline mr-auto"
            >
              Try sample restaurant list
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-[#0F5338] hover:bg-[#003B22] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Match Catalog Items</span>
            </button>
          </div>
        </form>

        {parsed && (
          <div className="mt-5 pt-4 border-t border-[#E4EAE4]">
            <p className="text-xs font-semibold text-[#202820] mb-2">
              Matched Vegetables ({parsed.length})
            </p>
            {parsed.length === 0 ? (
              <p className="text-xs text-[#687268]">
                No catalog matches found. Check spelling or browse the full catalog.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto mb-4">
                {parsed.map((item, idx) => (
                  <li
                    key={`${item.productId}-${idx}`}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#F6F8F6]"
                  >
                    <span className="font-semibold text-[#202820]">{item.productName}</span>
                    <span className="font-mono text-[#0F5338] tabular-nums">
                      Qty: {item.quantity} {item.unitOrPackage ? `(${item.unitOrPackage})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {unmatched.length > 0 && (
              <p className="text-xs text-[#687268] mb-3">
                Not in standard catalog: {unmatched.join(', ')}
              </p>
            )}

            {parsed.length > 0 && (
              <button
                type="button"
                onClick={handleAddAll}
                className="w-full h-11 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Add All Matched Items to Cart</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
