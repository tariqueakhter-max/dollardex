
import { supabase } from "./supabase";

export type BillingPlan = {
  id: string;
  name: string;
  price: number;
  validity_days?: number;
  speed?: string;
  description?: string;
  popular?: boolean;
  created_at?: string;
  updated_at?: string;
};

function normalizePlan(row: Record<string, unknown>): BillingPlan {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    price: Number(row.price ?? 0),
    validity_days:
      row.validity_days === null || row.validity_days === undefined
        ? undefined
        : Number(row.validity_days),
    speed: row.speed ? String(row.speed) : "",
    description: row.description ? String(row.description) : "",
    popular: Boolean(row.popular),
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getPlans(): Promise<BillingPlan[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data.map((row) => normalizePlan(row)) : [];
}

export async function getBillingPlans(): Promise<BillingPlan[]> {
  return getPlans();
}

export async function getPlanById(id: string): Promise<BillingPlan | undefined> {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizePlan(data) : undefined;
}

export async function addPlan(
  input: Omit<BillingPlan, "id" | "created_at" | "updated_at">
): Promise<BillingPlan> {
  const payload = {
    id: makeId(),
    name: String(input.name || "").trim(),
    price: Number(input.price || 0),
    validity_days:
      input.validity_days === undefined || input.validity_days === null
        ? null
        : Number(input.validity_days),
    speed: input.speed ? String(input.speed).trim() : "",
    description: input.description ? String(input.description).trim() : "",
    popular: Boolean(input.popular),
  };

  const { data, error } = await supabase
    .from("plans")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return normalizePlan(data);
}

export async function createPlan(
  input: Omit<BillingPlan, "id" | "created_at" | "updated_at">
): Promise<BillingPlan> {
  return addPlan(input);
}

export async function updatePlan(
  id: string,
  updates: Partial<Omit<BillingPlan, "id" | "created_at" | "updated_at">>
): Promise<BillingPlan> {
  const payload: Record<string, unknown> = {};

  if (updates.name !== undefined) payload.name = String(updates.name).trim();
  if (updates.price !== undefined) payload.price = Number(updates.price || 0);
  if (updates.validity_days !== undefined) {
    payload.validity_days =
      updates.validity_days === null ? null : Number(updates.validity_days);
  }
  if (updates.speed !== undefined) payload.speed = String(updates.speed || "").trim();
  if (updates.description !== undefined) {
    payload.description = String(updates.description || "").trim();
  }
  if (updates.popular !== undefined) payload.popular = Boolean(updates.popular);

  const { data, error } = await supabase
    .from("plans")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return normalizePlan(data);
}

export async function deletePlan(id: string): Promise<boolean> {
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function seedDefaultPlans(): Promise<BillingPlan[]> {
  return getPlans();
}