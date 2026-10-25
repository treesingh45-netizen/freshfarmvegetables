import React from 'react';
import { CartDrawer } from './components/CartDrawer';
import { FloatingWidgets } from './components/FloatingWidgets';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SmartListModal } from './components/SmartListModal';
import { StoreProvider, useStore } from './context/StoreContext';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { InfoPage } from './pages/StaticPages';
import { WholesalePage } from './pages/WholesalePage';

function AppRoutes() {
  const { currentPath } = useStore();

  let content: React.ReactNode;

  if (currentPath === '/' || currentPath === '') {
    content = <HomePage />;
  } else if (currentPath === '/products') {
    content = <CatalogPage />;
  } else if (currentPath.startsWith('/products/')) {
    const slug = decodeURIComponent(currentPath.slice('/products/'.length));
    content = <ProductDetailPage slug={slug} />;
  } else if (currentPath === '/cart') {
    content = <CartPage />;
  } else if (currentPath === '/checkout') {
    content = <CheckoutPage />;
  } else if (currentPath.startsWith('/order-confirmation/')) {
    const ref = decodeURIComponent(currentPath.slice('/order-confirmation/'.length));
    content = <OrderConfirmationPage reference={ref} />;
  } else if (currentPath === '/wholesale') {
    content = <WholesalePage />;
  } else if (currentPath === '/account') {
    content = <AccountPage />;
  } else if (currentPath === '/admin') {
    content = <AdminPage />;
  } else if (
    currentPath === '/about' ||
    currentPath === '/contact' ||
    currentPath === '/order-info' ||
    currentPath === '/privacy' ||
    currentPath === '/terms' ||
    currentPath === '/delivery-policy'
  ) {
    content = <InfoPage page={currentPath.slice(1) as any} />;
  } else {
    content = <HomePage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#202820]">
      <Header />
      <main className="flex-1">{content}</main>
      <Footer />
      <CartDrawer />
      <SmartListModal />
      <FloatingWidgets />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppRoutes />
    </StoreProvider>
  );
}
