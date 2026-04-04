import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./AppLayout";

/** Keep Landing eager */
import Landing from "./pages/Landing";
<Route path="/" element={<Navigate to="/ajcomputers_billing" replace />} />
import PlansPage from "./billing/pages/admin/PlansPage";
import AdminChangePassword from "./billing/pages/admin/AdminChangePassword";
import PortalChangePassword from "./billing/pages/portal/PortalChangePassword";
import AdminProtectedRoute from "./billing/components/AdminProtectedRoute";
import PortalProtectedRoute from "./billing/components/PortalProtectedRoute";
import BillingLayout from "./billing/components/BillingLayout";
import BillingHome from "./billing/pages/BillingHome";
import AdminLogin from "./billing/pages/admin/AdminLogin";
import AdminDashboard from "./billing/pages/admin/AdminDashboard";
import CustomersPage from "./billing/pages/admin/CustomersPage";
import NewCustomerPage from "./billing/pages/admin/NewCustomerPage";
import EditCustomerPage from "./billing/pages/admin/EditCustomerPage";
import PortalLogin from "./billing/pages/portal/PortalLogin";
import PortalDashboard from "./billing/pages/portal/PortalDashboard";
import ReminderSettings from "./billing/pages/admin/ReminderSettings";

/** Lazy-loaded DollarDex pages */
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Referral = lazy(() => import("./pages/Referral"));
const NetworkDashboard = lazy(() => import("./pages/NetworkDashboard"));
const ContractPage = lazy(() => import("./pages/ContractPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

function PageLoader() {
  return (
    <div className="yf-luxe">
      <div className="wrap" style={{ paddingTop: 32 }}>
        <div className="card">
          <h2 style={{ margin: 0 }}>Loading…</h2>
          <div className="small" style={{ marginTop: 8 }}>
            Preparing your dashboard…
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="yf-luxe">
      <div className="wrap" style={{ paddingTop: 32 }}>
        <div className="card">
          <h2>Page not found</h2>
          <div className="small">The page you’re looking for doesn’t exist.</div>
        </div>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* DollarDex routes only */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Landing />} />

          <Route path="/app">
            <Route index element={<Dashboard />} />
            <Route path="referral" element={<Referral />} />
            <Route path="network" element={<NetworkDashboard />} />
            <Route path="contract" element={<ContractPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="dashboard" element={<Navigate to="/app" replace />} />
          </Route>
        </Route>

        {/* AJ Computers Billing routes */}
        <Route path="/ajcomputers_billing" element={<BillingLayout />}>
          <Route index element={<BillingHome />} />

          {/* Admin login */}
          <Route path="admin" element={<AdminLogin />} />

          {/* Protected admin routes */}
            <Route element={<AdminProtectedRoute />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/customers" element={<CustomersPage />} />
            <Route path="admin/customers/new" element={<NewCustomerPage />} />
            <Route path="admin/customers/:id/edit" element={<EditCustomerPage />} />
            <Route path="admin/change-password" element={<AdminChangePassword />} />
            <Route path="admin/plans" element={<PlansPage />} />
	    <Route path="admin/reminders" element={<ReminderSettings />} />
          </Route>

          {/* Customer login */}
          <Route path="portal/login" element={<PortalLogin />} />

          {/* Protected customer routes */}
          <Route element={<PortalProtectedRoute />}>
            <Route path="portal/dashboard" element={<PortalDashboard />} />
            <Route path="portal/change-password" element={<PortalChangePassword />} />
          </Route>
        </Route>

        {/* Global 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}