import { supabase } from "./supabase";

export async function getPlans() {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("price", { ascending: true });

  if (error) {
    console.error("Error fetching plans:", error);
    return [];
  }

  return data;
}