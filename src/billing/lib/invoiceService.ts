import { supabase } from "./supabase";

export async function getInvoices(customerId: string) {
  const { data, error } = await supabase
    .from("billing_invoices")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }

  return data;
}

export async function markInvoicePaid(invoiceId: string) {
  const { error } = await supabase
    .from("billing_invoices")
    .update({ status: "paid" })
    .eq("id", invoiceId);

  if (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }

  return true;
}



export async function createInvoice({
  customer_id,
  plan_id,
  amount,
  due_before,
  due_after,
}: {
  customer_id: string;
  plan_id?: string;
  amount: number;
  due_before: number;
  due_after: number;
}) {
  const { error } = await supabase
    .from("billing_invoices")
    .insert([
      {
        customer_id,
        plan_id: plan_id || null,
        amount,
        due_before,
        due_after,
        status: "unpaid",
        billing_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
    ]);

  if (error) {
    console.error("Invoice creation failed:", error.message, error.details);
    throw error;
  }
}