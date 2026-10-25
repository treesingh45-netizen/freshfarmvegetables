import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_BUSINESS_SETTINGS, INITIAL_PRODUCTS } from '../data/catalogSeed';
import {
  BusinessSettings,
  CartItem,
  CartSummary,
  Product,
  UserPublic,
} from '../types';
import { calculateCartSummary, resolvePackageUnitPricePkr } from '../utils/commerce';

interface StoreContextValue {
  products: Product[];
  settings: BusinessSettings;
  loading: boolean;
  user: UserPublic | null;
  authToken: string | null;
  cartItems: CartItem[];
  cartSummary: CartSummary;
  selectedZoneId: string;
  setSelectedZoneId: (zoneId: string) => void;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  isSmartListOpen: boolean;
  openSmartList: () => void;
  closeSmartList: () => void;
  addToCart: (product: Product, quantity?: number, selectedPackage?: string, openDrawer?: boolean) => void;
  updateCartQuantity: (productId: string, selectedPackage: string, quantity: number) => void;
  removeFromCart: (productId: string, selectedPackage: string) => void;
  clearCart: () => void;
  confirmUpdatedCartPrices: () => void;
  setSession: (token: string, user: UserPublic) => void;
  logout: () => void;
  toggleFavorite: (productId: string) => Promise<void>;
  refreshStore: () => Promise<void>;
  currentPath: string;
  currentSearch: string;
  navigate: (to: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'ffv_cart_v1';
const ZONE_STORAGE_KEY = 'ffv_zone_v1';
const AUTH_STORAGE_KEY = 'ffv_auth_token_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_BUSINESS_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<UserPublic | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [selectedZoneId, setSelectedZoneIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(ZONE_STORAGE_KEY) || 'lahore-dha';
    } catch {
      return 'lahore-dha';
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isSmartListOpen, setIsSmartListOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [currentSearch, setCurrentSearch] = useState<string>(() => window.location.search || '');

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setCurrentSearch(window.location.search || '');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setCurrentPath(url.pathname);
    setCurrentSearch(url.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refreshStore = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/bootstrap', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) setProducts(data.products);
        if (data.settings) setSettings(data.settings);
        setUser(data.user || null);
      }
    } catch {
      // Fallback to local seed state if offline
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  const setSelectedZoneId = useCallback((zoneId: string) => {
    setSelectedZoneIdState(zoneId);
    try {
      localStorage.setItem(ZONE_STORAGE_KEY, zoneId);
    } catch {
      // Ignore
    }
  }, []);

  const setSession = useCallback((token: string, nextUser: UserPublic) => {
    setAuthToken(token);
    setUser(nextUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, token);
    } catch {
      // Ignore
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!authToken) {
        navigate('/account');
        return;
      }
      const res = await fetch('/api/account/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
      }
    },
    [authToken, navigate]
  );

  const addToCart = useCallback(
    (product: Product, quantity = 1, selectedPackage = '', openDrawer = true) => {
      const pkg = selectedPackage || (product.packageOptions[0] ?? '');
      setCartItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.productId === product.id && i.selectedPackage === pkg
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + Math.max(1, quantity),
          };
          return updated;
        }
        return [
          ...prev,
          {
            productId: product.id,
            quantity: Math.max(1, quantity),
            selectedPackage: pkg,
            snapshotPricePkr: resolvePackageUnitPricePkr(product, pkg),
            snapshotPricingMode: product.pricingMode,
          },
        ];
      });
      if (openDrawer) {
        setIsCartDrawerOpen(true);
      }
    },
    []
  );

  const updateCartQuantity = useCallback(
    (productId: string, selectedPackage: string, quantity: number) => {
      if (quantity <= 0) {
        setCartItems((prev) =>
          prev.filter(
            (i) => !(i.productId === productId && i.selectedPackage === selectedPackage)
          )
        );
        return;
      }
      setCartItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.selectedPackage === selectedPackage
            ? { ...i, quantity }
            : i
        )
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: string, selectedPackage: string) => {
    setCartItems((prev) =>
      prev.filter(
        (i) => !(i.productId === productId && i.selectedPackage === selectedPackage)
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const confirmUpdatedCartPrices = useCallback(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    setCartItems((prev) =>
      prev.map((item) => {
        const prod = map.get(item.productId);
        if (!prod) return item;
        return {
          ...item,
          snapshotPricePkr: resolvePackageUnitPricePkr(prod, item.selectedPackage),
          snapshotPricingMode: prod.pricingMode,
        };
      })
    );
  }, [products]);

  const cartSummary = useMemo(
    () => calculateCartSummary(cartItems, products, settings, selectedZoneId),
    [cartItems, products, settings, selectedZoneId]
  );

  const value: StoreContextValue = {
    products,
    settings,
    loading,
    user,
    authToken,
    cartItems,
    cartSummary,
    selectedZoneId,
    setSelectedZoneId,
    isCartDrawerOpen,
    openCartDrawer: () => setIsCartDrawerOpen(true),
    closeCartDrawer: () => setIsCartDrawerOpen(false),
    isSmartListOpen,
    openSmartList: () => setIsSmartListOpen(true),
    closeSmartList: () => setIsSmartListOpen(false),
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    confirmUpdatedCartPrices,
    setSession,
    logout,
    toggleFavorite,
    refreshStore,
    currentPath,
    currentSearch,
    navigate,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
