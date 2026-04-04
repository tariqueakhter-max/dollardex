import type { BillingCustomer } from "./billing-types";
import { calculateExpiryDate, getStatus } from "./date-utils";
import { supabase } from "./supabase";

/* -------------------- HELPERS -------------------- */

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function sanitizeDate(value?: string | null): string {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return value;
}

export function generateCustomerId(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}


/* -------------------- TYPES -------------------- */

type BillingCustomerRow = {
  id: string;
  customer_id: string;
  customer_name: string;
  address: string;
  mobile_number: string;
  installation_date: string | null;
  renewal_date: string | null;
  payment_date: string | null;
  total_due_amount: number | string | null;
  isp_name: string;
  copy_number: string;
  serial_number: string;
  portal_password: string;
  created_at: string | null;
  updated_at: string | null;
  current_due_amount: number | string | null;
  total_paid_amount: number | string | null;
  plan_name: string;
  plan_amount: number | string | null;
  plan_id: string;
  plan_validity: number | null;
};

/* -------------------- MAPPERS -------------------- */

function rowToCustomer(row: BillingCustomerRow): BillingCustomer {
  const renewalDate = sanitizeDate(row.renewal_date);
  const planValidity = toNumber(row.plan_validity, 30);

  const expiryDate = renewalDate
    ? calculateExpiryDate(renewalDate, planValidity)
    : "";

  return {
    id: row.id,
    customerId: String(row.customer_id || ""),
    customerName: row.customer_name || "",
    mobileNumber: row.mobile_number || "",
    address: row.address || "",
    ispName: row.isp_name || "",
    planId: row.plan_id || "",
    planName: row.plan_name || "",
    planAmount: toNumber(row.plan_amount, 0),
    planValidity,
    installationDate: row.installation_date || "",
    renewalDate,
    expiryDate,
    paymentDate: row.payment_date || "",
    totalDueAmount: toNumber(row.total_due_amount, 0),
    totalPaidAmount: toNumber(row.total_paid_amount, 0),
    currentDueAmount: toNumber(row.current_due_amount, 0),
    status: renewalDate ? getStatus(expiryDate) : "not_renewed",
    copyNumber: row.copy_number || "",
    serialNumber: row.serial_number || "",
    portalPassword: row.portal_password || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function customerToRow(customer: BillingCustomer) {
  return {
    customer_name: customer.customerName || "",
    mobile_number: customer.mobileNumber || "",
    address: customer.address || "",
    isp_name: customer.ispName || "",

    plan_id: customer.planId || null,
    plan_name: customer.planName || "",
    plan_amount: customer.planAmount || 0,
    plan_validity: customer.planValidity || 0,

    installation_date: customer.installationDate || null,
    renewal_date: customer.renewalDate || null,
    payment_date: customer.paymentDate || null,

    total_due_amount: customer.totalDueAmount || 0,
    total_paid_amount: customer.totalPaidAmount || 0,
    current_due_amount: customer.currentDueAmount || 0,

    copy_number: customer.copyNumber || "",
    serial_number: customer.serialNumber || "",
    portal_password: customer.portalPassword || "",

    created_at: customer.createdAt || new Date().toISOString(),
    updated_at: customer.updatedAt || new Date().toISOString(),
  };
}

/* -------------------- CORE -------------------- */

export async function addCustomer(customer: BillingCustomer) {
  const row = {
  ...customerToRow(customer),
  customer_id: customer.customerId || generateCustomerId(),
};

  const { data, error } = await supabase
    .from("billing_customers")
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error("Add customer failed:", error);
    throw error;
  }

  return rowToCustomer(data as BillingCustomerRow);
}

export async function getCustomerById(id: string) {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Fetch customer failed:", error);
    return null;
  }

  return rowToCustomer(data as BillingCustomerRow);
}

export async function updateCustomer(customer: BillingCustomer) {
const row = {
  ...customerToRow(customer),
  customer_id: customer.customerId || generateCustomerId(),
};

  const { data, error } = await supabase
    .from("billing_customers")
    .update({
      ...row,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customer.id)   // 🔥 VERY IMPORTANT
    .select()
    .single();

  if (error) {
    console.error("Update failed:", error);
    throw error;
  }

  return rowToCustomer(data as BillingCustomerRow);
}


/* -------------------- RENEW -------------------- */

export async function renewCustomer(
  customerId: string,
  options: {
    renewalDate?: string;
    paymentDate?: string;
    receivedAmount?: number;
  }
) {
  const customer = await getCustomerById(customerId);
  if (!customer) return null;

  const receivedAmount = Math.max(0, Number(options?.receivedAmount || 0));
  const planAmount = Math.max(0, Number(customer.planAmount || 0));

  const currentTotalDue = Number(customer.totalDueAmount || 0);
  const currentTotalPaid = Number(customer.totalPaidAmount || 0);

  const today = new Date();

  const currentExpiry = customer.renewalDate
    ? new Date(
        calculateExpiryDate(
          customer.renewalDate,
          Number(customer.planValidity || 30)
        )
      )
    : null;

  const baseDate =
    currentExpiry && currentExpiry > today ? currentExpiry : today;

  const newRenewalDate = new Date(baseDate);
  newRenewalDate.setDate(
    newRenewalDate.getDate() + Number(customer.planValidity || 30)
  );

  const nextRenewalDate = newRenewalDate.toISOString().slice(0, 10);

  const nextTotalDue = currentTotalDue + planAmount;
  const nextTotalPaid = currentTotalPaid + receivedAmount;
  const nextCurrentDue = Math.max(0, nextTotalDue - nextTotalPaid);

  await supabase
    .from("billing_customers")
    .update({
      renewal_date: nextRenewalDate,
      payment_date:
        receivedAmount > 0
          ? options?.paymentDate ||
            new Date().toISOString().slice(0, 10)
          : customer.paymentDate,
      total_due_amount: nextTotalDue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);
}

/* -------------------- PAYMENT -------------------- */

export async function receivePayment(
  customerId: string,
  amount: number
) {
  const safeAmount = Math.max(0, Number(amount || 0));

  await supabase.from("billing_payments").insert([
    {
      customer_id: customerId,
      amount: safeAmount,
      payment_date: new Date().toISOString(),
    },
  ]);

  const customer = await getCustomerById(customerId);
  if (!customer) return;

  const nextPaid = customer.totalPaidAmount + safeAmount;
  const nextDue = Math.max(0, customer.currentDueAmount - safeAmount);

  await supabase
    .from("billing_customers")
    .update({
      payment_date: new Date().toISOString(),
    })
    .eq("id", customerId);
}

/* -------------------- PASSWORD -------------------- */

export async function changeCustomerPassword(
  customerId: string,
  currentPassword: string,
  newPassword: string
) {
  const customer = await getCustomerById(customerId);

  if (!customer) {
    return { success: false, message: "Customer not found." };
  }

  if ((customer.portalPassword || "") !== currentPassword) {
    return { success: false, message: "Current password is incorrect." };
  }

  await supabase
    .from("billing_customers")
    .update({
      portal_password: newPassword,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  return {
    success: true,
    message: "Password changed successfully.",
  };
}

/* -------------------- DASHBOARD -------------------- */

export async function getDashboardStats() {
  const customers = await getCustomers();

  let totalDueAmount = 0;
  let activeCount = 0;
  let expiredCount = 0;
  let dueCount = 0;

  customers.forEach((c) => {
    const due = Number(c.currentDueAmount || 0);
    totalDueAmount += due;

    if (due > 0) dueCount++;

    if (c.expiryDate && new Date(c.expiryDate) < new Date()) {
      expiredCount++;
    } else {
      activeCount++;
    }
  });

  return {
    totalCustomers: customers.length,
    activeCount,
    expiredCount,
    dueCount,
    totalDueAmount,
  };
}

/* -------------------- SERIAL FIXED -------------------- */

export async function getNextSerialNumber() {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("serial_number");

  if (error) {
    console.error("Serial error:", error);
    return "1";
  }

  if (!data || data.length === 0) {
    return "1";
  }

  // 🔥 Convert ALL to numbers and find max
  const maxSerial = Math.max(
    ...data.map((c: any) => Number(c.serial_number) || 0)
  );

  return String(maxSerial + 1);
}

/* -------------------- CUSTOMER LOGIN FIXED -------------------- */

export async function authenticateCustomer(
  id: string,
  password: string
) {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("*")
.or(`customer_id.eq.${id},mobile_number.eq.${id}`)
.eq("portal_password", password)
.single();

  if (error || !data) {
    console.error("Login failed:", error);
    return null;
  }

return rowToCustomer(data);}


export async function getCustomers() {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch customers failed:", error);
    return [];
  }

  return (data || []).map((row) => rowToCustomer(row as BillingCustomerRow));
}


