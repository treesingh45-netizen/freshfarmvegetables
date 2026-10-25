import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ExternalLink,
  FileImage,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ProduceImage } from '../components/ProduceImage';
import { useStore } from '../context/StoreContext';
import {
  AuditLogEntry,
  BusinessSettings,
  Order,
  OrderStatus,
  PaymentStatus,
  PricingMode,
  Product,
  QuoteInquiry,
  QuoteStatus,
  StockStatus,
} from '../types';
import {
  buildOrderWhatsAppUrl,
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  formatPkr,
  normalizeDigitsPhone,
} from '../utils/commerce';

interface DraftPriceRow {
  pricingMode: PricingMode;
  pricePkr: string;
  priceUnit: string;
  stockStatus: StockStatus;
}

export function AdminPage() {
  const { user, authToken, setSession, logout, refreshStore } = useStore();

  useEffect(() => {
    document.title = 'Admin Dashboard — Fresh Farm Vegetables';
  }, []);

  // Admin Login Form
  const [loginEmail, setLoginEmail] = useState('admin@freshfarmvegetables.pk');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Overview State
  const [activeTab, setActiveTab] = useState<
    'prices' | 'products' | 'orders' | 'quotes' | 'settings' | 'audit'
  >('prices');
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<QuoteInquiry[]>([]);
  const [adminSettings, setAdminSettings] = useState<BusinessSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [whatsappApiStatus, setWhatsappApiStatus] = useState<{
    configured: boolean;
    provider: string;
    recipientPhone: string;
    description: string;
  } | null>(null);
  const [previewReceiptOrder, setPreviewReceiptOrder] = useState<Order | null>(null);
  const [statusBanner, setStatusBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // Draft Daily Price Board
  const [priceDrafts, setPriceDrafts] = useState<Record<string, DraftPriceRow>>({});
  const [publishingPrices, setPublishingPrices] = useState(false);

  // Gemini Rate Sheet Parser
  const [rawRateNotes, setRawRateNotes] = useState('');
  const [parsingRates, setParsingRates] = useState(false);

  // Product Editor Modal / Form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormOrigin, setProdFormOrigin] = useState<'local' | 'imported'>('local');
  const [prodFormDesc, setProdFormDesc] = useState('');
  const [prodFormImage, setProdFormImage] = useState('');
  const [prodFormPkgs, setProdFormPkgs] = useState('');
  const [prodFormMode, setProdFormMode] = useState<PricingMode>('quote');
  const [prodFormPrice, setProdFormPrice] = useState('');
  const [prodFormUnit, setProdFormUnit] = useState('per kg');
  const [prodFormStock, setProdFormStock] = useState<StockStatus>('unverified');
  const [prodFormFeatured, setProdFormFeatured] = useState(false);
  const [prodFormEnabled, setProdFormEnabled] = useState(true);

  const loadAdminOverview = useCallback(async () => {
    if (!authToken || user?.role !== 'admin') return;
    const res = await fetch('/api/admin/overview', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setAdminProducts(data.products || []);
    setOrders(data.orders || []);
    setQuotes(data.quotes || []);
    setAdminSettings(data.settings || null);
    setAuditLogs(data.auditLogs || []);
    setWhatsappApiStatus(data.whatsappApiStatus || null);

    const nextDrafts: Record<string, DraftPriceRow> = {};
    for (const p of data.products || []) {
      nextDrafts[p.id] = {
        pricingMode: p.pricingMode,
        pricePkr: p.pricePkr !== null ? String(p.pricePkr) : '',
        priceUnit: p.priceUnit || 'per kg',
        stockStatus: p.stockStatus,
      };
    }
    setPriceDrafts(nextDrafts);
  }, [authToken, user?.role]);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPass }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error || 'Invalid credentials.');
      return;
    }
    if (data.user.role !== 'admin') {
      setLoginError('This account does not have administrator privileges.');
      return;
    }
    setSession(data.token, data.user);
  };

  const handlePublishDailyRates = async () => {
    if (!authToken) return;
    setPublishingPrices(true);
    setStatusBanner('');
    setErrorBanner('');
    try {
      const updates = Object.entries(priceDrafts).map(([productId, row]) => ({
        productId,
        pricingMode: row.pricingMode,
        pricePkr: row.pricingMode === 'live' && row.pricePkr ? Number(row.pricePkr) : null,
        priceUnit: row.priceUnit,
        stockStatus: row.stockStatus,
      }));

      const res = await fetch('/api/admin/prices/bulk-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish prices.');
      setStatusBanner(`Published confirmed daily market pricing (${data.updatedCount} items updated).`);
      await loadAdminOverview();
      await refreshStore();
    } catch (err: any) {
      setErrorBanner(err.message || 'Unable to publish daily prices.');
    } finally {
      setPublishingPrices(false);
    }
  };

  const handleAiParseRateSheet = async () => {
    if (!authToken || !rawRateNotes.trim()) return;
    setParsingRates(true);
    setErrorBanner('');
    try {
      const res = await fetch('/api/admin/ai/parse-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ rawRatesText: rawRateNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not parse rate notes.');
      const next = { ...priceDrafts };
      for (const u of data.updates || []) {
        if (next[u.productId]) {
          next[u.productId] = {
            ...next[u.productId],
            pricingMode: 'live',
            pricePkr: String(Math.round(u.pricePkr)),
            priceUnit: u.priceUnit || next[u.productId].priceUnit,
            stockStatus:
              next[u.productId].stockStatus === 'unverified'
                ? 'in_stock'
                : next[u.productId].stockStatus,
          };
        }
      }
      setPriceDrafts(next);
      setStatusBanner(
        `Matched ${(data.updates || []).length} rates into the draft table below. Review and click Publish Daily Rates.`
      );
    } catch (err: any) {
      setErrorBanner(err.message || 'Could not parse daily rate notes.');
    } finally {
      setParsingRates(false);
    }
  };

  const openProductEditor = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setCreatingNew(false);
      setProdFormName(prod.name);
      setProdFormOrigin(prod.origin);
      setProdFormDesc(prod.description);
      setProdFormImage(prod.imageUrl);
      setProdFormPkgs(prod.packageOptions.join(', '));
      setProdFormMode(prod.pricingMode);
      setProdFormPrice(prod.pricePkr !== null ? String(prod.pricePkr) : '');
      setProdFormUnit(prod.priceUnit || 'per kg');
      setProdFormStock(prod.stockStatus);
      setProdFormFeatured(prod.featured);
      setProdFormEnabled(prod.enabled);
    } else {
      setEditingProduct(null);
      setCreatingNew(true);
      setProdFormName('');
      setProdFormOrigin('local');
      setProdFormDesc('');
      setProdFormImage('/images/produce/hero-produce.jpg');
      setProdFormPkgs('');
      setProdFormMode('quote');
      setProdFormPrice('');
      setProdFormUnit('per kg');
      setProdFormStock('unverified');
      setProdFormFeatured(false);
      setProdFormEnabled(true);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProdFormImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setErrorBanner('');
    setStatusBanner('');

    const payload = {
      name: prodFormName,
      origin: prodFormOrigin,
      description: prodFormDesc,
      imageUrl: prodFormImage,
      packageOptions: prodFormPkgs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      pricingMode: prodFormMode,
      pricePkr: prodFormMode === 'live' ? Number(prodFormPrice) : null,
      priceUnit: prodFormUnit,
      stockStatus: prodFormStock,
      featured: prodFormFeatured,
      enabled: prodFormEnabled,
    };

    const url = editingProduct
      ? `/api/admin/products/${editingProduct.id}`
      : '/api/admin/products';
    const method = editingProduct ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorBanner(data.error || 'Failed to save product.');
      return;
    }

    setEditingProduct(null);
    setCreatingNew(false);
    setStatusBanner(`Saved product "${data.product.name}".`);
    await loadAdminOverview();
    await refreshStore();
  };

  const handleOrderUpdate = async (
    orderId: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus,
    deliveryFeePkr: number | null,
    verificationNote?: string
  ) => {
    if (!authToken) return;
    setErrorBanner('');
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status, paymentStatus, deliveryFeePkr, verificationNote }),
    });
    if (res.ok) {
      setStatusBanner(
        paymentStatus === 'paid'
          ? 'Payment verified and order marked as Paid.'
          : 'Order and payment status updated.'
      );
      await loadAdminOverview();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorBanner(data.error || 'Unable to update order.');
    }
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminSettings) return;
    if (file.size > 3 * 1024 * 1024) {
      setErrorBanner('QR code image must be 3 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAdminSettings({ ...adminSettings, paymentQrImageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuoteSave = async (quote: QuoteInquiry) => {
    if (!authToken) return;
    const res = await fetch(`/api/admin/quotes/${quote.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        status: quote.status,
        adminResponseNotes: quote.adminResponseNotes,
        items: quote.items,
      }),
    });
    if (res.ok) {
      setStatusBanner(`Updated quote ${quote.reference}.`);
      await loadAdminOverview();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !adminSettings) return;
    setErrorBanner('');
    setStatusBanner('');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(adminSettings),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatusBanner('Business & payment settings updated.');
      await loadAdminOverview();
      await refreshStore();
    } else {
      setErrorBanner(data.error || 'Could not update settings.');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="bg-white rounded-3xl border border-[#E4EAE4] p-7 space-y-5">
          <div className="flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#0F5338]" />
            <h1 className="text-xl font-bold text-[#202820]">Administrator Access</h1>
          </div>
          <p className="text-xs text-[#687268] leading-relaxed">
            Sign in with an authorized Fresh Farm Vegetables administrator account to manage daily PKR pricing, products, quote inquiries, orders, and business settings.
          </p>
          <div className="p-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-[11px] text-[#687268]">
            Initial setup credentials (override via <code className="font-mono">INITIAL_ADMIN_PASSWORD</code> in production):{' '}
            <span className="font-mono text-[#202820]">admin@freshfarmvegetables.pk</span> /{' '}
            <span className="font-mono text-[#202820]">FreshFarmDHA6!</span>
          </div>

          {loginError && <p className="text-xs text-[#E4483D] font-medium">{loginError}</p>}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label htmlFor="adm-email" className="block text-xs font-semibold mb-1">
                Admin Email
              </label>
              <input
                id="adm-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
              />
            </div>
            <div>
              <label htmlFor="adm-pass" className="block text-xs font-semibold mb-1">
                Password
              </label>
              <input
                id="adm-pass"
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#0F5338] hover:bg-[#003B22] text-white text-sm font-semibold transition-colors"
            >
              Sign In to Admin Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#0F5338]">Store Administration</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#202820]">
            Fresh Farm Vegetables Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadAdminOverview}
            className="h-9 px-3.5 rounded-xl border border-[#E4EAE4] bg-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="h-9 px-3.5 rounded-xl border border-[#E4EAE4] bg-white text-xs font-semibold text-[#E4483D] inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-3.5 rounded-2xl bg-[#12B326]/10 border border-[#12B326]/30 text-xs sm:text-sm font-medium text-[#003B22]">
          {statusBanner}
        </div>
      )}
      {errorBanner && (
        <div className="p-3.5 rounded-2xl bg-[#FFF5F5] border border-[#E4483D]/30 text-xs sm:text-sm font-medium text-[#E4483D]">
          {errorBanner}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { id: 'prices', label: 'Daily Price Management' },
            { id: 'products', label: `Products (${adminProducts.length})` },
            { id: 'quotes', label: `Quote Requests (${quotes.length})` },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'settings', label: 'Business Settings' },
            { id: 'audit', label: 'Audit Logs' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'bg-[#0F5338] text-white'
                : 'bg-white border border-[#E4EAE4] text-[#202820] hover:border-[#0F5338]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DAILY PRICE MANAGEMENT */}
      {activeTab === 'prices' && (
        <div className="space-y-6">
          {/* AI Daily Rate Sheet Quick Parser */}
          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#12B326]" />
                <h2 className="text-sm font-bold text-[#202820]">
                  Quick Market Rate Sheet Parser
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRawRateNotes(
                    'Iceberg Lettuce 320 per kg, Vacuum-Packed Lettuce 380 per pack, Tomatoes 180 per kg, Cherry Tomatoes 450 per punnet, Broccoli 420 per kg'
                  )
                }
                className="text-xs font-semibold text-[#12B326] hover:underline"
              >
                Insert sample morning rates
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={rawRateNotes}
                onChange={(e) => setRawRateNotes(e.target.value)}
                placeholder="Paste morning mandi rates (e.g., Iceberg Lettuce 320 per kg, Tomatoes 180 per kg...)"
                aria-label="Daily market rate notes"
                className="flex-1 h-10 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
              />
              <button
                type="button"
                disabled={parsingRates}
                onClick={handleAiParseRateSheet}
                className="h-10 px-4 rounded-xl bg-[#0F5338] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                {parsingRates && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Fill Draft Prices</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E4EAE4] overflow-hidden">
            <div className="p-5 border-b border-[#E4EAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#202820]">Daily Rate Sheet</h2>
                <p className="text-xs text-[#687268]">
                  Switch items between "Request Today's Rate" and confirmed live PKR pricing.
                </p>
              </div>
              <button
                type="button"
                disabled={publishingPrices}
                onClick={handlePublishDailyRates}
                className="h-11 px-6 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0"
              >
                {publishingPrices ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Publish Daily Rates</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F6F8F6] border-b border-[#E4EAE4] text-xs text-[#687268]">
                    <th className="py-3 px-4 font-semibold">Vegetable</th>
                    <th className="py-3 px-4 font-semibold">Purchasing Mode</th>
                    <th className="py-3 px-4 font-semibold">Confirmed Price (PKR)</th>
                    <th className="py-3 px-4 font-semibold">Unit</th>
                    <th className="py-3 px-4 font-semibold">Verified Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE4]">
                  {adminProducts.map((prod) => {
                    const draft = priceDrafts[prod.id] || {
                      pricingMode: prod.pricingMode,
                      pricePkr: prod.pricePkr !== null ? String(prod.pricePkr) : '',
                      priceUnit: prod.priceUnit || 'per kg',
                      stockStatus: prod.stockStatus,
                    };
                    return (
                      <tr key={prod.id} className="hover:bg-[#F6F8F6]/50">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#202820]">{prod.name}</p>
                          <p className="text-xs text-[#687268] capitalize">{prod.origin}</p>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Pricing mode for ${prod.name}`}
                            value={draft.pricingMode}
                            onChange={(e) =>
                              setPriceDrafts((prev) => ({
                                ...prev,
                                [prod.id]: {
                                  ...draft,
                                  pricingMode: e.target.value as PricingMode,
                                },
                              }))
                            }
                            className="h-9 px-2.5 rounded-lg bg-[#F6F8F6] border border-[#E4EAE4] text-xs"
                          >
                            <option value="quote">Request Today's Rate</option>
                            <option value="live">Live PKR Price</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min={0}
                            aria-label={`PKR price for ${prod.name}`}
                            placeholder="—"
                            value={draft.pricePkr}
                            onChange={(e) =>
                              setPriceDrafts((prev) => ({
                                ...prev,
                                [prod.id]: {
                                  ...draft,
                                  pricingMode: e.target.value ? 'live' : 'quote',
                                  pricePkr: e.target.value,
                                },
                              }))
                            }
                            className="w-28 h-9 px-3 rounded-lg bg-[#F6F8F6] border border-[#E4EAE4] text-xs font-mono tabular-nums"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            aria-label={`Unit for ${prod.name}`}
                            value={draft.priceUnit}
                            onChange={(e) =>
                              setPriceDrafts((prev) => ({
                                ...prev,
                                [prod.id]: { ...draft, priceUnit: e.target.value },
                              }))
                            }
                            className="w-28 h-9 px-2.5 rounded-lg bg-[#F6F8F6] border border-[#E4EAE4] text-xs"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Stock status for ${prod.name}`}
                            value={draft.stockStatus}
                            onChange={(e) =>
                              setPriceDrafts((prev) => ({
                                ...prev,
                                [prod.id]: {
                                  ...draft,
                                  stockStatus: e.target.value as StockStatus,
                                },
                              }))
                            }
                            className="h-9 px-2.5 rounded-lg bg-[#F6F8F6] border border-[#E4EAE4] text-xs"
                          >
                            <option value="unverified">Unverified</option>
                            <option value="in_stock">In Stock</option>
                            <option value="limited">Limited</option>
                            <option value="out_of_stock">Out of Stock</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => openProductEditor()}
              className="h-10 px-4 rounded-xl bg-[#12B326] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {(creatingNew || editingProduct) && (
            <form
              onSubmit={handleSaveProduct}
              className="bg-white rounded-3xl border border-[#12B326] p-6 space-y-4"
            >
              <h2 className="text-lg font-bold text-[#202820]">
                {editingProduct ? `Edit ${editingProduct.name}` : 'Add New Vegetable'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={prodFormName}
                    onChange={(e) => setProdFormName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Category Origin</label>
                  <select
                    value={prodFormOrigin}
                    onChange={(e) => setProdFormOrigin(e.target.value as 'local' | 'imported')}
                    className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                  >
                    <option value="local">Fresh Local Produce</option>
                    <option value="imported">Imported Vegetables</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Package Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 1 kg, 5 kg crate, Vacuum Pack"
                    value={prodFormPkgs}
                    onChange={(e) => setProdFormPkgs(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Pricing Mode</label>
                  <select
                    value={prodFormMode}
                    onChange={(e) => setProdFormMode(e.target.value as PricingMode)}
                    className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                  >
                    <option value="quote">Request Today's Rate</option>
                    <option value="live">Live PKR Price</option>
                  </select>
                </div>
                {prodFormMode === 'live' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Confirmed Price (PKR)</label>
                    <input
                      type="number"
                      min={1}
                      value={prodFormPrice}
                      onChange={(e) => setProdFormPrice(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm font-mono"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold mb-1">Stock Status</label>
                  <select
                    value={prodFormStock}
                    onChange={(e) => setProdFormStock(e.target.value as StockStatus)}
                    className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                  >
                    <option value="unverified">Unverified</option>
                    <option value="in_stock">In Stock</option>
                    <option value="limited">Limited</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">
                    Image Path or Upload Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={prodFormImage}
                      onChange={(e) => setProdFormImage(e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-xs"
                    />
                    <label className="h-10 px-3 rounded-xl border border-[#E4EAE4] text-xs font-semibold inline-flex items-center cursor-pointer bg-white">
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={prodFormFeatured}
                      onChange={(e) => setProdFormFeatured(e.target.checked)}
                    />
                    <span>Featured</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={prodFormEnabled}
                      onChange={(e) => setProdFormEnabled(e.target.checked)}
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={prodFormDesc}
                    onChange={(e) => setProdFormDesc(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#12B326] text-white text-xs font-semibold"
                >
                  Save Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setCreatingNew(false);
                  }}
                  className="h-10 px-4 rounded-xl border border-[#E4EAE4] text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#E4EAE4] p-4 flex items-center gap-3.5"
              >
                <ProduceImage
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#E4EAE4]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#202820] truncate">
                    {p.name} {!p.enabled ? '(Disabled)' : ''}
                  </p>
                  <p className="text-xs text-[#687268]">
                    {p.origin === 'local' ? 'Local' : 'Imported'} ·{' '}
                    {p.pricingMode === 'live' && p.pricePkr
                      ? formatPkr(p.pricePkr)
                      : 'Request Rate'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openProductEditor(p)}
                  className="h-8 px-3 rounded-lg border border-[#E4EAE4] text-xs font-semibold hover:border-[#12B326]"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUOTE REQUESTS */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E4EAE4] p-10 text-center text-sm text-[#687268]">
              No wholesale or quote inquiries yet.
            </div>
          ) : (
            quotes.map((q) => {
              const custDigits = normalizeDigitsPhone(q.phone);
              const replyLines = q.items.map(
                (i) =>
                  `- ${i.productName} (${i.quantity} ${i.unitOrPackage}): ${
                    i.quotedUnitPricePkr ? formatPkr(i.quotedUnitPricePkr) : 'Available'
                  }`
              );
              const replyWa = `https://wa.me/${
                custDigits.startsWith('0') ? `92${custDigits.slice(1)}` : custDigits
              }?text=${encodeURIComponent(
                `Hello ${q.contactName}, regarding your Fresh Farm Vegetables inquiry (${q.reference}):\n${replyLines.join(
                  '\n'
                )}`
              )}`;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl border border-[#E4EAE4] p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-mono font-bold text-[#202820]">
                        {q.reference}
                      </span>
                      <span className="text-xs text-[#687268] ml-2">
                        {q.businessName ? `${q.businessName} · ` : ''}
                        {q.contactName} ({q.businessType}) · {q.phone}
                      </span>
                    </div>
                    <select
                      value={q.status}
                      onChange={(e) =>
                        setQuotes((prev) =>
                          prev.map((item) =>
                            item.id === q.id
                              ? { ...item, status: e.target.value as QuoteStatus }
                              : item
                          )
                        )
                      }
                      className="h-9 px-3 rounded-lg bg-[#F6F8F6] border border-[#E4EAE4] text-xs font-semibold"
                    >
                      <option value="new">New Inquiry</option>
                      <option value="quoted">Quoted</option>
                      <option value="approved_by_customer">Approved by Customer</option>
                      <option value="converted_to_order">Converted to Order</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <p className="text-xs text-[#687268]">
                    Delivery: {q.deliveryAddress}{' '}
                    {q.preferredDeliveryDate ? `· Preferred date: ${q.preferredDeliveryDate}` : ''}
                  </p>

                  <div className="space-y-2">
                    {q.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F6F8F6] text-xs"
                      >
                        <span className="font-semibold text-[#202820]">
                          {item.productName} × {item.quantity} ({item.unitOrPackage})
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#687268]">Quote PKR:</span>
                          <input
                            type="number"
                            value={item.quotedUnitPricePkr ?? ''}
                            onChange={(e) =>
                              setQuotes((prev) =>
                                prev.map((qt) =>
                                  qt.id === q.id
                                    ? {
                                        ...qt,
                                        items: qt.items.map((it, i) =>
                                          i === idx
                                            ? {
                                                ...it,
                                                quotedUnitPricePkr: e.target.value
                                                  ? Number(e.target.value)
                                                  : null,
                                              }
                                            : it
                                        ),
                                      }
                                    : qt
                                )
                              )
                            }
                            placeholder="Unit PKR"
                            className="w-24 h-8 px-2 rounded-lg bg-white border border-[#E4EAE4] font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Admin response notes (shown in customer portal)..."
                      value={q.adminResponseNotes}
                      onChange={(e) =>
                        setQuotes((prev) =>
                          prev.map((qt) =>
                            qt.id === q.id ? { ...qt, adminResponseNotes: e.target.value } : qt
                          )
                        )
                      }
                      className="flex-1 h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuoteSave(q)}
                      className="h-10 px-4 rounded-xl bg-[#12B326] text-white text-xs font-semibold"
                    >
                      Save Quote Response
                    </button>
                    <a
                      href={replyWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-4 rounded-xl border border-[#0F5338] text-[#0F5338] text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Reply on WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: ORDERS & PAYMENT VERIFICATION */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E4EAE4] p-10 text-center text-sm text-[#687268]">
              No checkout orders yet.
            </div>
          ) : (
            orders.map((ord) => {
              const adminWaUrl = buildOrderWhatsAppUrl(
                adminSettings?.whatsappIntl || '+923334934403',
                ord,
                adminSettings || undefined
              );
              const custDigits = normalizeDigitsPhone(ord.contact.phone);
              const custIntlDigits = custDigits.startsWith('0')
                ? `92${custDigits.slice(1)}`
                : custDigits;
              const custWaUrl = `https://wa.me/${custIntlDigits}?text=${encodeURIComponent(
                `Hello ${ord.contact.fullName}, regarding your Fresh Farm Vegetables order ${ord.reference} (${formatPkr(
                  ord.grandTotalPkr ?? ord.subtotalPkr
                )}): Payment status is currently "${formatPaymentStatusLabel(ord.paymentStatus)}".`
              )}`;

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-[#DCE8DC] p-6 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-mono font-bold text-[#18261B]">
                          {ord.reference}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-[#12B326]/15 text-[#0F5338]'
                              : ord.paymentStatus === 'pending_verification'
                              ? 'bg-[#FFF8EB] border border-[#E5B85B] text-[#7A5100]'
                              : ord.paymentStatus === 'rejected'
                              ? 'bg-[#FFF5F5] text-[#C62F24]'
                              : 'bg-[#F4FAF5] text-[#0F5338]'
                          }`}
                        >
                          {formatPaymentStatusLabel(ord.paymentStatus)}
                        </span>
                        <span className="text-xs text-[#687268] font-mono">
                          {new Date(ord.createdAt).toLocaleString('en-PK')}
                        </span>
                      </div>
                      <p className="text-xs text-[#202820]">
                        <strong>{ord.contact.fullName}</strong> · {ord.contact.phone} ·{' '}
                        {ord.contact.email}
                      </p>
                      <p className="text-xs text-[#687268]">
                        Delivery: {ord.shippingAddress.streetAddress}
                        {ord.shippingAddress.apartment
                          ? `, ${ord.shippingAddress.apartment}`
                          : ''}{' '}
                        — {ord.shippingAddress.zoneName}, {ord.shippingAddress.city}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {ord.paymentStatus !== 'paid' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOrderUpdate(
                              ord.id,
                              ord.status === 'pending_confirmation' ? 'confirmed' : ord.status,
                              'paid',
                              ord.deliveryFeePkr
                            )
                          }
                          className="h-9 px-3.5 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify &amp; Mark Paid</span>
                        </button>
                      )}
                      {ord.paymentStatus === 'pending_verification' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOrderUpdate(
                              ord.id,
                              ord.status,
                              'rejected',
                              ord.deliveryFeePkr,
                              'Payment reference could not be matched. Please upload a clear payment receipt.'
                            )
                          }
                          className="h-9 px-3 rounded-xl border border-[#E4483D]/40 bg-[#FFF5F5] text-[#C62F24] text-xs font-semibold hover:bg-[#E4483D] hover:text-white transition-colors"
                        >
                          Decline Proof
                        </button>
                      )}

                      <select
                        aria-label={`Order status for ${ord.reference}`}
                        value={ord.status}
                        onChange={(e) =>
                          handleOrderUpdate(
                            ord.id,
                            e.target.value as OrderStatus,
                            ord.paymentStatus,
                            ord.deliveryFeePkr
                          )
                        }
                        className="h-9 px-2.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-xs font-semibold"
                      >
                        <option value="pending_confirmation">Pending Confirmation</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <select
                        aria-label={`Payment status for ${ord.reference}`}
                        value={ord.paymentStatus}
                        onChange={(e) =>
                          handleOrderUpdate(
                            ord.id,
                            ord.status,
                            e.target.value as PaymentStatus,
                            ord.deliveryFeePkr
                          )
                        }
                        className="h-9 px-2.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-xs font-semibold"
                      >
                        <option value="pending_verification">Payment Verification Pending</option>
                        <option value="cod_pending">COD Pending</option>
                        <option value="paid">Verified &amp; Paid</option>
                        <option value="rejected">Verification Declined</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Proof & Verification Details Box */}
                  <div className="p-4 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-[#18261B]">
                        <span className="text-[#5A6B5D]">Payment Method:</span>{' '}
                        <strong>
                          {formatPaymentMethodLabel(ord.paymentMethod, adminSettings || undefined)}
                        </strong>
                      </p>
                      <p className="text-[#18261B]">
                        <span className="text-[#5A6B5D]">Transaction Reference:</span>{' '}
                        <strong className="font-mono text-[#0F5338]">
                          {ord.paymentDetails?.transactionId || 'None provided'}
                        </strong>
                        {ord.paymentDetails?.senderInfo
                          ? ` · Sender: ${ord.paymentDetails.senderInfo}`
                          : ''}
                      </p>
                      {ord.paymentDetails?.verifiedAt && (
                        <p className="text-[#0F5338] font-semibold">
                          Verified by {ord.paymentDetails.verifiedBy || 'Admin'} at{' '}
                          {new Date(ord.paymentDetails.verifiedAt).toLocaleString('en-PK')}
                        </p>
                      )}
                    </div>

                    {ord.paymentDetails?.receiptDataUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewReceiptOrder(ord)}
                        className="inline-flex items-center gap-2.5 p-2 pr-3.5 rounded-xl bg-white border border-[#DCE8DC] hover:border-[#12B326] text-xs font-semibold text-[#0F5338] shrink-0"
                      >
                        <img
                          src={ord.paymentDetails.receiptDataUrl}
                          alt={`Receipt for ${ord.reference}`}
                          className="w-10 h-10 rounded-lg object-cover border border-[#E4EAE4]"
                        />
                        <span className="inline-flex items-center gap-1">
                          <FileImage className="w-3.5 h-3.5 text-[#12B326]" />
                          <span>Inspect Receipt</span>
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Order Line Items */}
                  <ul className="text-xs text-[#4A5A4D] space-y-1.5">
                    {ord.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>
                          <strong className="text-[#18261B]">{item.productName}</strong> (
                          {item.selectedPackage}) x {item.quantity}
                        </span>
                        <span className="font-mono font-semibold text-[#18261B] tabular-nums">
                          {formatPkr(item.lineTotalPkr)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-3 border-t border-[#E4EAE4] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={adminWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3.5 rounded-xl bg-[#0F5338] hover:bg-[#003B22] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send Order Summary (+923334934403)</span>
                      </a>
                      {custDigits.length >= 10 && (
                        <a
                          href={custWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-3.5 rounded-xl border border-[#DCE8DC] bg-white hover:border-[#12B326] text-xs font-semibold text-[#0F5338] inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Message Customer</span>
                        </a>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-[#687268] font-mono tabular-nums">
                        Subtotal: {formatPkr(ord.subtotalPkr)} · Delivery:{' '}
                        {ord.deliveryFeePkr !== null ? formatPkr(ord.deliveryFeePkr) : 'TBD'}
                      </p>
                      <p className="text-sm font-mono font-bold text-[#0F5338] tabular-nums">
                        Order Total: {formatPkr(ord.grandTotalPkr ?? ord.subtotalPkr)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Receipt Inspection Modal */}
      {previewReceiptOrder && previewReceiptOrder.paymentDetails?.receiptDataUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Payment receipt for ${previewReceiptOrder.reference}`}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18261B]">
                  Payment Receipt — {previewReceiptOrder.reference}
                </h3>
                <p className="text-xs text-[#687268]">
                  Amount: {formatPkr(previewReceiptOrder.grandTotalPkr ?? previewReceiptOrder.subtotalPkr)}{' '}
                  {previewReceiptOrder.paymentDetails.transactionId
                    ? `· Ref: ${previewReceiptOrder.paymentDetails.transactionId}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceiptOrder(null)}
                aria-label="Close receipt preview"
                className="w-9 h-9 rounded-xl border border-[#E4EAE4] flex items-center justify-center text-[#687268] hover:text-[#18261B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto rounded-2xl border border-[#DCE8DC] bg-[#F4FAF5] p-3">
              <img
                src={previewReceiptOrder.paymentDetails.receiptDataUrl}
                alt={`Uploaded payment receipt for ${previewReceiptOrder.reference}`}
                className="max-h-[58vh] w-auto mx-auto rounded-xl object-contain"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2.5">
              {previewReceiptOrder.paymentStatus !== 'paid' && (
                <button
                  type="button"
                  onClick={async () => {
                    const target = previewReceiptOrder;
                    setPreviewReceiptOrder(null);
                    await handleOrderUpdate(
                      target.id,
                      target.status === 'pending_confirmation' ? 'confirmed' : target.status,
                      'paid',
                      target.deliveryFeePkr
                    );
                  }}
                  className="h-10 px-4 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify &amp; Mark Paid</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewReceiptOrder(null)}
                className="h-10 px-4 rounded-xl border border-[#E4EAE4] text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BUSINESS & PAYMENT SETTINGS */}
      {activeTab === 'settings' && adminSettings && (
        <form
          onSubmit={handleSaveSettings}
          className="space-y-6"
        >
          {/* Payment QR Code & Official Payment Link Integration */}
          <div className="bg-white rounded-3xl border border-[#DCE8DC] p-6 sm:p-8 space-y-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#12B326]/15 text-[#0F5338] flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#18261B]">
                    Payment QR Code &amp; Official Payment Link
                  </h2>
                  <p className="text-xs text-[#5A6B5D]">
                    Upload your official payment QR code and paste your payment/account link. Orders remain Pending Verification until you verify them.
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-[#0F5338] bg-[#F4FAF5] px-3.5 py-2 rounded-xl border border-[#DCE8DC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminSettings.qrPaymentEnabled}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, qrPaymentEnabled: e.target.checked })
                  }
                />
                <span>Enable QR &amp; Online Account Transfer</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#18261B] mb-1">
                  Payment Option Title
                </label>
                <input
                  type="text"
                  value={adminSettings.paymentProviderTitle}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, paymentProviderTitle: e.target.value })
                  }
                  placeholder="QR Code & Official Account Transfer"
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18261B] mb-1">
                  Official Account Title
                </label>
                <input
                  type="text"
                  value={adminSettings.paymentAccountTitle}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, paymentAccountTitle: e.target.value })
                  }
                  placeholder="Fresh Farm Vegetables"
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18261B] mb-1">
                  Bank or Wallet Provider Name
                </label>
                <input
                  type="text"
                  value={adminSettings.paymentBankOrWalletName}
                  onChange={(e) =>
                    setAdminSettings({
                      ...adminSettings,
                      paymentBankOrWalletName: e.target.value,
                    })
                  }
                  placeholder="e.g., Meezan Bank / Raast / JazzCash / Easypaisa"
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18261B] mb-1">
                  Official Account Number / IBAN
                </label>
                <input
                  type="text"
                  value={adminSettings.paymentAccountNumber}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, paymentAccountNumber: e.target.value })
                  }
                  placeholder="Paste verified IBAN or mobile wallet number"
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#18261B] mb-1">
                  Official Payment / Account Link (HTTPS URL)
                </label>
                <input
                  type="url"
                  value={adminSettings.paymentLinkUrl}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, paymentLinkUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#18261B] mb-1.5">
                  Official Payment QR Code Image
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-[#F4FAF5] border border-[#DCE8DC]">
                  {adminSettings.paymentQrImageUrl ? (
                    <img
                      src={adminSettings.paymentQrImageUrl}
                      alt="Configured Payment QR Code"
                      className="w-24 h-24 rounded-xl object-contain bg-white border border-[#DCE8DC] p-1.5 shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-white border border-dashed border-[#B7D7B9] flex flex-col items-center justify-center text-[#5A6B5D] shrink-0">
                      <QrCode className="w-7 h-7 text-[#12B326]" />
                      <span className="text-[10px] font-semibold mt-1">No QR Yet</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <label className="h-9 px-3.5 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload QR Code Image</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleQrImageUpload}
                          className="sr-only"
                        />
                      </label>
                      {adminSettings.paymentQrImageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setAdminSettings({ ...adminSettings, paymentQrImageUrl: '' })
                          }
                          className="h-9 px-3 rounded-xl border border-[#DCE8DC] bg-white text-xs font-semibold text-[#E4483D] inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove QR</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={adminSettings.paymentQrImageUrl}
                      onChange={(e) =>
                        setAdminSettings({
                          ...adminSettings,
                          paymentQrImageUrl: e.target.value,
                        })
                      }
                      placeholder="Or paste hosted QR image URL / asset path..."
                      className="w-full h-9 px-3 rounded-xl bg-white border border-[#DCE8DC] text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#18261B] mb-1">
                  Customer Payment Instructions
                </label>
                <textarea
                  rows={2}
                  value={adminSettings.paymentInstructions}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, paymentInstructions: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-xs"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Order Notifications Status (+923334934403) */}
          <div className="bg-white rounded-3xl border border-[#DCE8DC] p-6 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#12B326]" />
              <h3 className="text-base font-bold text-[#18261B]">
                WhatsApp Order Notifications ({adminSettings.whatsappIntl})
              </h3>
            </div>
            <p className="text-xs text-[#5A6B5D] leading-relaxed">
              {whatsappApiStatus
                ? whatsappApiStatus.description
                : 'Automatic WhatsApp Cloud API / Webhook notifications dispatch to +923334934403 when configured via server environment variables; otherwise a prefilled WhatsApp button is provided automatically.'}
            </p>
          </div>

          {/* Business Contact & Delivery Zones */}
          <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-[#202820]">
              Store Contact &amp; Lahore Delivery Zones
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Phone Display</label>
                <input
                  type="text"
                  value={adminSettings.phoneDisplay}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, phoneDisplay: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  WhatsApp Notification Number (International)
                </label>
                <input
                  type="text"
                  value={adminSettings.whatsappIntl}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, whatsappIntl: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Official Business Email</label>
                <input
                  type="email"
                  placeholder="farmfreshvegetables@gmail.com"
                  value={adminSettings.email}
                  onChange={(e) => setAdminSettings({ ...adminSettings, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
                <label className="inline-flex items-center gap-2 text-xs mt-1.5">
                  <input
                    type="checkbox"
                    checked={adminSettings.emailVerified}
                    onChange={(e) =>
                      setAdminSettings({ ...adminSettings, emailVerified: e.target.checked })
                    }
                  />
                  <span>Display email address publicly</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Business Address</label>
                <input
                  type="text"
                  value={adminSettings.address}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, address: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Applicable Tax (%)</label>
                <input
                  type="number"
                  min={0}
                  value={adminSettings.taxRatePercent}
                  onChange={(e) =>
                    setAdminSettings({
                      ...adminSettings,
                      taxRatePercent: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm font-mono"
                />
              </div>
              <div className="flex items-center gap-5 pt-5">
                <label className="inline-flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={adminSettings.codEnabled}
                    onChange={(e) =>
                      setAdminSettings({ ...adminSettings, codEnabled: e.target.checked })
                    }
                  />
                  <span>Enable Cash on Delivery (COD)</span>
                </label>
              </div>
            </div>

            {/* Delivery Zone Fees */}
            <div className="pt-4 border-t border-[#E4EAE4] space-y-3">
              <h3 className="text-sm font-bold text-[#18261B]">
                Lahore Delivery Zones &amp; PKR Fees
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {adminSettings.deliveryZones.map((zone, idx) => (
                  <div
                    key={zone.id}
                    className="p-3.5 rounded-2xl bg-[#F6F8F6] border border-[#E4EAE4] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#18261B] truncate">{zone.name}</p>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-[#687268] mt-1">
                        <input
                          type="checkbox"
                          checked={zone.codEnabled}
                          onChange={(e) => {
                            const updated = [...adminSettings.deliveryZones];
                            updated[idx] = { ...zone, codEnabled: e.target.checked };
                            setAdminSettings({ ...adminSettings, deliveryZones: updated });
                          }}
                        />
                        <span>COD Allowed</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-[#687268]">PKR</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="TBD"
                        value={zone.deliveryFeePkr !== null ? String(zone.deliveryFeePkr) : ''}
                        onChange={(e) => {
                          const updated = [...adminSettings.deliveryZones];
                          updated[idx] = {
                            ...zone,
                            deliveryFeePkr:
                              e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                          };
                          setAdminSettings({ ...adminSettings, deliveryZones: updated });
                        }}
                        className="w-24 h-9 px-2.5 rounded-xl bg-white border border-[#DCE8DC] text-xs font-mono tabular-nums"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="h-11 px-6 rounded-2xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-bold transition-colors"
            >
              Save Business &amp; Payment Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 space-y-3">
          <h2 className="text-lg font-bold text-[#202820]">Administrative Audit Log</h2>
          <ul className="divide-y divide-[#E4EAE4] text-xs">
            {auditLogs.map((log) => (
              <li key={log.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-[#0F5338]">{log.action}</span>
                  <span className="text-[#202820] ml-2">{log.details}</span>
                </div>
                <span className="text-[#687268] font-mono">
                  {log.actorEmail} · {new Date(log.createdAt).toLocaleString('en-PK')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
