import { supabase } from "./supabase";

/* =========================
   GET CUSTOMERS
========================= */
export async function getCustomers() {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("*")
    .order("customer_name", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((c: any) => ({
    id: c.id,
    customerName: c.customer_name,
    mobileNumber: c.mobile_number,
    planName: c.isp_name,
    expiryDate: c.renewal_date,
    currentDueAmount: c.total_due_amount,
  }));
}

/* =========================
   DASHBOARD STATS
========================= */
export async function getDashboardStats() {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("*");

  if (error || !data) {
    console.error(error);
if (error || !data) {
  console.error(error);

  return {
    totalCustomers: 0,
    activeCount: 0,
    expiredCount: 0,
    dueCount: 0,
    totalDueAmount: 0,
    amountToday: 0,
    amountYesterday: 0,
    totalReceived: 0,
  };
}

  }

  const totalCustomers = data.length;

  let activeCount = 0;
  let expiredCount = 0;
  let dueCount = 0;
  let totalDueAmount = 0;

const now = new Date().getTime();
  data.forEach((c: any) => {
    const expiry = c.renewal_date
      ? new Date(c.renewal_date).getTime()
      : 0;

    const due = Number(c.total_due_amount || 0);

    if (expiry < now) expiredCount++;
    else activeCount++;

    if (due > 0) dueCount++;

    totalDueAmount += due;
  });

  return {
    totalCustomers,
    activeCount,
    expiredCount,
    dueCount,
    totalDueAmount,
    amountToday: 0,
    amountYesterday: 0,
    totalReceived: 0,
  };
}

/* =========================
   RECEIVE PAYMENT
========================= */
export async function receivePayment(
  customerId: string,
  amount: number
) {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("total_due_amount")
    .eq("id", customerId)
    .single();

  if (error || !data) throw error;

  const newDue =
    Number(data.total_due_amount || 0) - amount;

  const { error: updateError } = await supabase
    .from("billing_customers")
    .update({
      total_due_amount: newDue < 0 ? 0 : newDue,
    })
    .eq("id", customerId);

  if (updateError) throw updateError;
}