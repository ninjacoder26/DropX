import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Footer, MobileNav } from './components/layout';
import { InstallBanner } from './components/InstallBanner';
import { ScrollToTop } from './components/ScrollToTop';
import { MaintenanceGate, MaintenancePage } from './components/MaintenancePage';
import { isMaintenanceMode } from './lib/maintenance';
import { useAuth } from './store/AuthContext';
import type { ReactNode } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const DropsPage = lazy(() => import('./pages/DropsPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();
  if (loading) return <div className="dx-full py-16 text-sm text-ink/60">Loading…</div>;
  if (!configured || !user) {
    // Preserve intent: after login the customer lands back here with their
    // guest bag intact (it merges into the server cart on sign-in).
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading, user } = useAuth();
  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-ink/60">Checking permissions…</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Frontend gate is UX only — Supabase RLS + SECURITY DEFINER functions enforce admin server-side.
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function MaintenanceRoute() {
  const nav = useNavigate();
  if (!isMaintenanceMode()) return <Navigate to="/" replace />;
  return (
    <MaintenancePage
      onContinue={() => {
        nav('/', { replace: true });
      }}
    />
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <ScrollToTop />
      <InstallBanner />
      <MaintenanceGate>
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-sm text-ink/60">Loading…</div>}>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
            <Route path="/order-success/:id" element={<RequireAuth><OrderSuccessPage /></RequireAuth>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
            <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/drops" element={<DropsPage />} />
            <Route path="/drops/:slug" element={<DropsPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/maintenance" element={<MaintenanceRoute />} />
            <Route path="/admin/*" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <MobileNav />
      </MaintenanceGate>
    </div>
  );
}
