import { Navigate, Outlet } from "react-router-dom";
import { isPortalLoggedIn } from "../lib/billing-auth";

export default function PortalProtectedRoute() {
  const isLoggedIn = isPortalLoggedIn();

  if (!isLoggedIn) {
    return <Navigate to="/customers" replace />;
  }

  return <Outlet />;
}