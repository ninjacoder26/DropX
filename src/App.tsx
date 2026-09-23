import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Footer, MobileNav } from './components/layout';
import { InstallBanner } from './components/InstallBanner';
import { ScrollToTop } from './components/ScrollToTop';
import { Skeleton } from './components/ui';
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
const StaffPage = lazy(() => import('./pages/StaffPage'));
const StaffLoginPage = lazy(() => import('./pages/StaffLoginPage'));
const GetAccInfoPage = lazy(() => import('./pages/GetAccInfoPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();
  if (loading) return <div className="dx-full space-y-3 py-16"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-5" /></div>;
  if (!configured || !user) {
    // Preserve intent: after login the customer lands back here with their
    // guest bag intact (it merges into the server cart on sign-in).
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, isSubadmin, loading, ready, user } = useAuth();
  if (loading || !ready) return <div className="mx-auto max-w-7xl space-y-3 px-4 py-16"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-5" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  // Subadmins enter read-only (except product photos) — RLS enforces it
  // server-side; the admin UI disables everything else.
  // Frontend gate is UX only — Supabase RLS + SECURITY DEFINER functions enforce admin server-side.
  if (!isAdmin && !isSubadmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireStaff({ children }: { children: ReactNode }) {
  const { user, isSubadmin, loading, ready, isAdmin } = useAuth();
  if (loading || !ready) return <div className="mx-auto max-w-6xl space-y-3 px-4 py-16"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-5" /></div>;
  if (!user) return <Navigate to="/staff/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (!isSubadmin) return <Navigate to="/" replace />;
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

/**
 * If boot data (session restore) still hasn't landed after 5 seconds,
 * say so: either the backend is down or the connection dropped. Retry
 * reloads; dismiss hides it for the session.
 */
function SlowDataNotice() {
  const { loading } = useAuth();
  const [slow, setSlow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, [loading ]);
  if (!loading || !slow || dismissed) return null;
  return (
    <div
      role="alert"
      className="fixed bottom-20 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 rounded-2xl bg-ink p-4 text-paper shadow-pop lg:bottom-6"
    >
      <p className="font-display text-sm font-extrabold">Taking longer than usual…</p>
      <p className="mt-1 text-xs leading-relaxed text-paper/70">
        DropX might be down, or your connection dropped. Your data is safe — give it a moment, then try again.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-ember px-4 py-2 text-xs font-bold text-white transition hover:bg-ember-dark"
        >
          Retry
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-full px-4 py-2 text-xs font-bold text-paper/70 transition hover:text-paper"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  // The admin has its own shell (sidebar + topbar + drawer) — rendering the
  // storefront navbar/footer on top doubled every navigation control.
  // The staff portal is separate the same way.
  const isAdminRoute = pathname.startsWith('/admin');
  const isStaffRoute = pathname.startsWith('/staff');
  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <ScrollToTop />
      <InstallBanner />
      <SlowDataNotice />
      <MaintenanceGate>
        {!isAdminRoute && !isStaffRoute && <Navbar />}
        <main className="flex-1">
          <Suspense fallback={<div className="mx-auto max-w-7xl space-y-3 px-4 py-16"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-24" /></div>}>
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
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route path="/staff" element={<RequireStaff><StaffPage /></RequireStaff>} />
            <Route path="/get-acc-info" element={<GetAccInfoPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && !isStaffRoute && <Footer />}
      {!isAdminRoute && !isStaffRoute && <MobileNav />}
      </MaintenanceGate>
    </div>
  );
}
