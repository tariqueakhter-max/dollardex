import { Navigate, Outlet } from "react-router-dom";
import { isPortalLoggedIn } from "../lib/billing-auth";

export default function PortalProtectedRoute() {
  const isLoggedIn = isPortalLoggedIn();

  if (!isLoggedIn) {
    return <Navigate to="/ajcomputers_billing/portal/login" replace />;
  }

  return <Outlet />;
}