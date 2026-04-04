import { Navigate, Outlet } from "react-router-dom";
import { getAdminUsername } from "../lib/billing-auth";

export default function AdminProtectedRoute() {
  const username = getAdminUsername();

  if (!username) {
    return <Navigate to="/ajcomputers_billing/admin" replace />;
  }

  return <Outlet />;
}