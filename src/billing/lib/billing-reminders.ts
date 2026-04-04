
import { supabase } from "./supabase";
import { getCustomers, type getDashboardStats } from "./billing-storage";
import type { BillingCustomer } from "./billing-types";

export type ReminderSettings = {
  id: string;
  enabled: boolean;
  days_before_expiry: number;
  channel: string;
  send_hour: number;
};

export type ReminderCandidate = BillingCustomer & {
  reminderReason: "due" | "expiry_soon" | "expired";
};

const DEFAULT_SETTINGS: Omit<ReminderSettings, "id"> = {
  enabled: true,
  days_before_expiry: 3,
  channel: "whatsapp",
  send_hour: 10,
};

function todayAtMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDateOnly(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function diffInDays(dateA: Date, dateB: Date) {
  const ms = dateA.getTime() - dateB.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function safeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizePhoneForWhatsApp(phone?: string) {
  const raw = String(phone || "").replace(/[^\d]/g, "");
  if (!raw) return "";
  if (raw.startsWith("91") && raw.length >= 12) return raw;
  if (raw.length === 10) return `91${raw}`;
  return raw;
}

export function buildReminderMessage(customer: BillingCustomer, reason: ReminderCandidate["reminderReason"]) {
  const dueAmount = safeNumber(customer.currentDueAmount, 0);
  const expiryDate = customer.expiryDate || "N/A";
  const planName = customer.planName || "Broadband Plan";

  if (reason === "due") {
    return `Hello ${customer.customerName}, this is AJCOMPUTERS Cable and Broadband Services. Your current due amount is ₹${dueAmount}. Plan: ${planName}. Kindly clear your payment to continue uninterrupted service.`;
  }

  if (reason === "expiry_soon") {
    return `Hello ${customer.customerName}, your ${planName} plan is expiring on ${expiryDate}. Please renew in time to avoid service interruption. - AJCOMPUTERS`;
  }

  return `Hello ${customer.customerName}, your ${planName} plan expired on ${expiryDate}. Please renew your broadband plan to restore uninterrupted service. - AJCOMPUTERS`;
}

export async function getReminderSettings(): Promise<ReminderSettings | null> {
  const { data, error } = await supabase
    .from("billing_reminder_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensureReminderSettings(): Promise<ReminderSettings> {
  const existing = await getReminderSettings();
  if (existing) return existing;

  const payload = {
    ...DEFAULT_SETTINGS,
    id: crypto.randomUUID(),
  };

  const { data, error } = await supabase
    .from("billing_reminder_settings")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateReminderSettings(
  id: string,
  updates: Partial<ReminderSettings>
): Promise<void> {
  const { error } = await supabase
    .from("billing_reminder_settings")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function getReminderCandidates(): Promise<ReminderCandidate[]> {
  const settings = await ensureReminderSettings();
  const customers = await getCustomers();

  if (!settings.enabled) return [];

  const today = todayAtMidnight();
  const daysBefore = safeNumber(settings.days_before_expiry, 3);

  const results: ReminderCandidate[] = [];

  for (const customer of customers) {
    const dueAmount = safeNumber(customer.currentDueAmount, 0);
    const expiry = parseDateOnly(customer.expiryDate);

    if (dueAmount > 0) {
      results.push({
        ...customer,
        reminderReason: "due",
      });
      continue;
    }

    if (!expiry) continue;

    const remainingDays = diffInDays(expiry, today);

    if (remainingDays < 0) {
      results.push({
        ...customer,
        reminderReason: "expired",
      });
      continue;
    }

    if (remainingDays <= daysBefore) {
      results.push({
        ...customer,
        reminderReason: "expiry_soon",
      });
    }
  }

  return results;
}

export async function sendWhatsAppReminder(customer: BillingCustomer, reason?: ReminderCandidate["reminderReason"]) {
  const actualReason =
    reason ||
    (safeNumber(customer.currentDueAmount, 0) > 0
      ? "due"
      : customer.expiryDate && parseDateOnly(customer.expiryDate) && parseDateOnly(customer.expiryDate)! < todayAtMidnight()
      ? "expired"
      : "expiry_soon");

  const phone = normalizePhoneForWhatsApp(customer.mobileNumber);
  if (!phone) {
    throw new Error("Customer mobile number is missing or invalid for WhatsApp.");
  }

  const message = buildReminderMessage(customer, actualReason);

  const { data, error } = await supabase.functions.invoke("send-whatsapp-reminder", {
    body: {
      to: phone,
      customerName: customer.customerName,
      planName: customer.planName,
      dueAmount: safeNumber(customer.currentDueAmount, 0),
      expiryDate: customer.expiryDate || "",
      reason: actualReason,
      message,
    },
  });

  if (error) throw error;
  return data;
}