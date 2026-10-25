import React, { useEffect, useState } from 'react';
import { Heart, LogOut, MapPin, Package, Plus, Trash2, User } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { Order, QuoteInquiry } from '../types';
import { formatPaymentStatusLabel, formatPkr } from '../utils/commerce';

export function AccountPage() {
  const {
    products,
    settings,
    user,
    authToken,
    setSession,
    logout,
    currentSearch,
    navigate,
  } = useStore();

  useEffect(() => {
    document.title = 'Customer Account — Fresh Farm Vegetables';
  }, []);

  const initialTab = new URLSearchParams(currentSearch).get('tab') || 'orders';
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes' | 'addresses' | 'favorites' | 'profile'>(
    (['orders', 'quotes', 'addresses', 'favorites', 'profile'].includes(initialTab)
      ? initialTab
      : 'orders') as any
  );

  // Auth mode state for signed-out visitors
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStepReady, setResetStepReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Signed-in account data
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<QuoteInquiry[]>([]);

  // Profile edit state
  const [profName, setProfName] = useState(user?.fullName || '');
  const [profPhone, setProfPhone] = useState(user?.phone || '');
  const [profBiz, setProfBiz] = useState(user?.businessName || '');
  const [profSavedMsg, setProfSavedMsg] = useState('');

  // New Address state
  const [addrLabel, setAddrLabel] = useState('Main Kitchen');
  const [addrFirst, setAddrFirst] = useState('');
  const [addrLast, setAddrLast] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrZone, setAddrZone] = useState('lahore-dha');
  const [addrError, setAddrError] = useState('');

  useEffect(() => {
    if (!authToken || !user) return;
    setProfName(user.fullName);
    setProfPhone(user.phone);
    setProfBiz(user.businessName);

    fetch('/api/account/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setOrders(data.orders || []);
          setQuotes(data.quotes || []);
        }
      })
      .catch(() => {});
  }, [authToken, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthError(data.error || 'Sign in failed.');
      return;
    }
    setSession(data.token, data.user);
    if (data.user.role === 'admin') {
      navigate('/admin');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, businessName, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthError(data.error || 'Registration failed.');
      return;
    }
    setSession(data.token, data.user);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    const res = await fetch('/api/auth/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthError(data.error || 'Could not verify account.');
      return;
    }
    setResetCode(data.resetCode || '');
    setResetStepReady(true);
    setAuthSuccess(data.message);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetCode, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthError(data.error || 'Could not reset password.');
      return;
    }
    setSession(data.token, data.user);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setProfSavedMsg('');
    const res = await fetch('/api/account/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fullName: profName, phone: profPhone, businessName: profBiz }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setSession(authToken, data.user);
      setProfSavedMsg('Profile updated.');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setAddrError('');
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        label: addrLabel,
        firstName: addrFirst,
        lastName: addrLast,
        phone: addrPhone,
        streetAddress: addrStreet,
        apartment: '',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '',
        zoneId: addrZone,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAddrError(data.error || 'Could not save address.');
      return;
    }
    setSession(authToken, data.user);
    setAddrStreet('');
  };

  const handleDeleteAddress = async (id: string) => {
    if (!authToken) return;
    const res = await fetch(`/api/account/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setSession(authToken, data.user);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-[#E4EAE4] p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#202820]">
              {authMode === 'login'
                ? 'Customer Sign In'
                : authMode === 'register'
                ? 'Create Customer Account'
                : 'Reset Password'}
            </h1>
            <p className="text-xs text-[#687268] mt-1">
              Accounts are optional — you can also request rates directly via WhatsApp at any time.
            </p>
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold ${
                authMode === 'login' ? 'bg-white text-[#202820] shadow-2xs' : 'text-[#687268]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
              }}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold ${
                authMode === 'register' ? 'bg-white text-[#202820] shadow-2xs' : 'text-[#687268]'
              }`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <p className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E4483D]/30 text-xs text-[#E4483D]">
              {authError}
            </p>
          )}
          {authSuccess && (
            <p className="p-3 rounded-xl bg-[#F6F8F6] border border-[#12B326]/30 text-xs text-[#0F5338]">
              {authSuccess}
            </p>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="acc-login-email" className="block text-xs font-semibold mb-1">
                  Email Address
                </label>
                <input
                  id="acc-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              <div>
                <label htmlFor="acc-login-pass" className="block text-xs font-semibold mb-1">
                  Password
                </label>
                <input
                  id="acc-login-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold transition-colors"
              >
                Sign In
              </button>
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('reset');
                    setResetStepReady(false);
                    setAuthError('');
                  }}
                  className="text-[#0F5338] hover:underline"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="text-[#687268] hover:text-[#202820]"
                >
                  Admin Portal
                </button>
              </div>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              <div>
                <label htmlFor="reg-biz" className="block text-xs font-semibold mb-1">
                  Restaurant / Business Name (Optional)
                </label>
                <input
                  id="reg-biz"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold mb-1">
                  Email Address *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold mb-1">
                  Phone / WhatsApp Number *
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  placeholder="0333-4934403"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              <div>
                <label htmlFor="reg-pass" className="block text-xs font-semibold mb-1">
                  Password (min 6 characters) *
                </label>
                <input
                  id="reg-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#12B326] hover:bg-[#0F5338] text-white text-sm font-semibold transition-colors"
              >
                Create Account
              </button>
            </form>
          )}

          {authMode === 'reset' && (
            <form
              onSubmit={resetStepReady ? handleConfirmReset : handleRequestReset}
              className="space-y-4"
            >
              <div>
                <label htmlFor="rst-email" className="block text-xs font-semibold mb-1">
                  Registered Email Address
                </label>
                <input
                  id="rst-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                />
              </div>
              {!resetStepReady ? (
                <div>
                  <label htmlFor="rst-phone" className="block text-xs font-semibold mb-1">
                    Registered Phone Number
                  </label>
                  <input
                    id="rst-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="rst-newpass" className="block text-xs font-semibold mb-1">
                    New Password
                  </label>
                  <input
                    id="rst-newpass"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#0F5338] text-white text-sm font-semibold"
              >
                {resetStepReady ? 'Set New Password' : 'Verify Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const favoriteProducts = products.filter(
    (p) => p.enabled && user.favoriteProductIds.includes(p.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#0F5338]">Customer Portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#202820]">
            Welcome, {user.fullName}
          </h1>
          <p className="text-xs text-[#687268]">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="h-10 px-4 rounded-xl bg-[#0F5338] text-white text-xs font-semibold"
            >
              Open Admin Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="h-10 px-4 rounded-xl border border-[#E4EAE4] bg-white text-xs font-semibold text-[#202820] hover:border-[#E4483D] hover:text-[#E4483D] inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
            { id: 'quotes', label: `Quote Requests (${quotes.length})`, icon: Package },
            { id: 'favorites', label: `Saved Produce (${favoriteProducts.length})`, icon: Heart },
            { id: 'addresses', label: `Addresses (${user.savedAddresses.length})`, icon: MapPin },
            { id: 'profile', label: 'Contact Details', icon: User },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-[#12B326] text-white'
                  : 'bg-white border border-[#E4EAE4] text-[#202820] hover:border-[#12B326]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E4EAE4] p-10 text-center">
              <p className="text-sm text-[#687268] mb-4">You have not placed any orders yet.</p>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="h-10 px-5 rounded-xl bg-[#12B326] text-white text-xs font-semibold"
              >
                Explore Products
              </button>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-[#E4EAE4] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-mono font-bold text-[#202820]">{ord.reference}</p>
                    <span className="px-2 py-0.5 rounded-md bg-[#F4FAF5] border border-[#DCE8DC] text-[11px] font-semibold text-[#0F5338]">
                      {formatPaymentStatusLabel(ord.paymentStatus)}
                    </span>
                  </div>
                  <p className="text-xs text-[#687268] mt-1">
                    Placed {new Date(ord.createdAt).toLocaleDateString('en-PK')} ·{' '}
                    {ord.items.length} items · Dispatch:{' '}
                    <strong className="text-[#0F5338] capitalize">
                      {ord.status.replace(/_/g, ' ')}
                    </strong>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {ord.grandTotalPkr !== null && (
                    <span className="text-sm font-mono font-bold text-[#202820] tabular-nums">
                      {formatPkr(ord.grandTotalPkr)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/order-confirmation/${encodeURIComponent(
                          ord.reference
                        )}?email=${encodeURIComponent(ord.contact.email)}`
                      )
                    }
                    className="h-9 px-3.5 rounded-xl border border-[#E4EAE4] text-xs font-semibold hover:border-[#12B326]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E4EAE4] p-10 text-center">
              <p className="text-sm text-[#687268] mb-4">No quote inquiries submitted under this account yet.</p>
              <button
                type="button"
                onClick={() => navigate('/wholesale')}
                className="h-10 px-5 rounded-xl bg-[#0F5338] text-white text-xs font-semibold"
              >
                Request Wholesale Quote
              </button>
            </div>
          ) : (
            quotes.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl border border-[#E4EAE4] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-mono font-bold text-[#202820]">{q.reference}</span>
                  <span className="text-xs font-semibold text-[#0F5338] capitalize">
                    Status: {q.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <ul className="text-xs text-[#687268] space-y-1">
                  {q.items.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>
                        {item.productName} × {item.quantity} ({item.unitOrPackage})
                      </span>
                      {item.quotedUnitPricePkr ? (
                        <span className="font-mono font-semibold text-[#202820]">
                          Quoted: {formatPkr(item.quotedUnitPricePkr)} / unit
                        </span>
                      ) : (
                        <span>Awaiting rate</span>
                      )}
                    </li>
                  ))}
                </ul>
                {q.adminResponseNotes && (
                  <p className="p-3 rounded-xl bg-[#F6F8F6] text-xs text-[#202820]">
                    Supplier Note: {q.adminResponseNotes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          {favoriteProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E4EAE4] p-10 text-center">
              <p className="text-sm text-[#687268] mb-4">
                Save your kitchen's regular vegetables for quick reordering.
              </p>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="h-10 px-5 rounded-xl bg-[#12B326] text-white text-xs font-semibold"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {favoriteProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-3">
            {user.savedAddresses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E4EAE4] p-6 text-sm text-[#687268]">
                No saved addresses yet. Add your Lahore delivery location using the form.
              </div>
            ) : (
              user.savedAddresses.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-[#E4EAE4] p-5 flex items-start justify-between gap-4"
                >
                  <div className="text-sm">
                    <p className="font-bold text-[#202820]">{a.label}</p>
                    <p className="text-[#687268] mt-0.5">
                      {a.firstName} {a.lastName} · {a.phone}
                    </p>
                    <p className="text-[#687268]">
                      {a.streetAddress}, {a.city}, {a.province}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(a.id)}
                    aria-label={`Delete address ${a.label}`}
                    className="p-2 text-[#687268] hover:text-[#E4483D]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleAddAddress}
            className="lg:col-span-5 bg-white rounded-3xl border border-[#E4EAE4] p-6 space-y-3.5"
          >
            <h2 className="text-base font-bold text-[#202820] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#12B326]" />
              <span>Add Delivery Address</span>
            </h2>
            {addrError && <p className="text-xs text-[#E4483D]">{addrError}</p>}
            <input
              type="text"
              placeholder="Address Label (e.g., Main Kitchen)"
              value={addrLabel}
              onChange={(e) => setAddrLabel(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name *"
                value={addrFirst}
                onChange={(e) => setAddrFirst(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={addrLast}
                onChange={(e) => setAddrLast(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
              />
            </div>
            <input
              type="tel"
              placeholder="Receiving Phone *"
              value={addrPhone}
              onChange={(e) => setAddrPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
            />
            <select
              value={addrZone}
              onChange={(e) => setAddrZone(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
            >
              {settings.deliveryZones
                .filter((z) => z.enabled)
                .map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
            </select>
            <input
              type="text"
              placeholder="Street Address, Commercial CCA / Phase *"
              value={addrStreet}
              onChange={(e) => setAddrStreet(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
            />
            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-[#12B326] text-white text-xs font-semibold"
            >
              Save Address
            </button>
          </form>
        </div>
      )}

      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl border border-[#E4EAE4] p-6 max-w-lg space-y-4"
        >
          <h2 className="text-lg font-bold text-[#202820]">Contact Details</h2>
          {profSavedMsg && <p className="text-xs font-semibold text-[#12B326]">{profSavedMsg}</p>}
          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold mb-1">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
            />
          </div>
          <div>
            <label htmlFor="prof-biz" className="block text-xs font-semibold mb-1">
              Business / Kitchen Name
            </label>
            <input
              id="prof-biz"
              type="text"
              value={profBiz}
              onChange={(e) => setProfBiz(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
            />
          </div>
          <div>
            <label htmlFor="prof-phone" className="block text-xs font-semibold mb-1">
              Phone / WhatsApp
            </label>
            <input
              id="prof-phone"
              type="tel"
              value={profPhone}
              onChange={(e) => setProfPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#F6F8F6] border border-[#E4EAE4] text-sm"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-5 rounded-xl bg-[#12B326] text-white text-xs font-semibold"
          >
            Save Changes
          </button>
        </form>
      )}
    </div>
  );
}
