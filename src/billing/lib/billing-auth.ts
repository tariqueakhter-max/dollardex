import { supabase } from "./supabase";

const ADMIN_KEY = "aj_billing_admin";
const PORTAL_KEY = "aj_billing_portal_customer_id";

/* =========================
   ADMIN SESSION
========================= */

export function loginAdmin(username: string) {
  localStorage.setItem(ADMIN_KEY, username);
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}

export function getAdminUsername() {
  return localStorage.getItem(ADMIN_KEY);
}

export function isAdminLoggedIn() {
  return !!localStorage.getItem(ADMIN_KEY);
}

/* =========================
   PORTAL SESSION
========================= */

export function loginPortal(customerId: string) {
  localStorage.setItem(PORTAL_KEY, customerId);
}

export function logoutPortal() {
  localStorage.removeItem(PORTAL_KEY);
}

export function getPortalCustomerId() {
  return localStorage.getItem(PORTAL_KEY);
}

/* =========================
   ADMIN AUTH
========================= */

export async function validateAdminLogin(username: string, password: string) {
  const { data, error } = await supabase
    .from("billing_admin")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function changeAdminPassword(
  username: string,
  currentPassword: string,
  newPassword: string
) {
  const { data, error } = await supabase
    .from("billing_admin")
    .select("*")
    .eq("username", username)
    .eq("password", currentPassword)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Current password is incorrect");
  }

  const { error: updateError } = await supabase
    .from("billing_admin")
    .update({ password: newPassword })
    .eq("id", data.id);

  if (updateError) {
    throw updateError;
  }
}

/* =========================
   CUSTOMER LOGIN
========================= */

export async function validateCustomerLogin(
  loginId: string,
  password: string
) {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("*")
    .or(`customer_id.eq.${loginId},mobile_number.eq.${loginId}`)
    .eq("portal_password", password)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export function loginCustomer(customer: { id: string }) {
  localStorage.setItem(PORTAL_KEY, customer.id);
}

export function isPortalLoggedIn() {
  return !!localStorage.getItem(PORTAL_KEY);
}