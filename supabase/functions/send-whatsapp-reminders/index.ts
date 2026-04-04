/// <reference types="vite/client" />
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("APP_SUPABASE_URL")!,
  Deno.env.get("APP_SUPABASE_SERVICE_KEY")!
);

Deno.serve(async () => {
  try {
    const { data: settingsRows, error: settingsError } = await supabase
      .from("billing_reminder_settings")
      .select("*")
      .limit(1);

    if (settingsError) throw settingsError;
    const settings = settingsRows?.[0];

    if (!settings || !settings.enabled) {
      return new Response(JSON.stringify({ ok: true, skipped: "reminders disabled" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const { data: customers, error: customersError } = await supabase
      .from("billing_customers")
      .select("*")
      .eq("reminder_enabled", true);

    if (customersError) throw customersError;

    const results: unknown[] = [];

    for (const customer of customers ?? []) {
      if (!customer.renewal_date) continue;

      const renewalDate = new Date(customer.renewal_date);
      if (Number.isNaN(renewalDate.getTime())) continue;

      const validity = Number(customer.plan_validity || 30);
      const expiry = new Date(renewalDate);
      expiry.setDate(expiry.getDate() + validity - 1);

      const diffMs =
        new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime() -
        new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysLeft !== Number(settings.days_before_expiry)) continue;

      const alreadySentToday =
        customer.last_reminder_sent_at &&
        new Date(customer.last_reminder_sent_at).toISOString().slice(0, 10) === todayStr;

      if (alreadySentToday) continue;

      const phone = (customer.whatsapp_number || customer.mobile_number || "").replace(/\D/g, "");
      if (!phone) continue;

      const waPhoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
      const waToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
      const templateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "payment_due_reminder";

      const expiryDisplay = `${pad(expiry.getDate())}-${pad(expiry.getMonth() + 1)}-${expiry.getFullYear()}`;

      const payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: customer.customer_name || "" },
                { type: "text", text: customer.plan_name || "Plan" },
                { type: "text", text: expiryDisplay },
                { type: "text", text: String(customer.current_due_amount ?? 0) },
              ],
            },
          ],
        },
      };

      const resp = await fetch(
        `https://graph.facebook.com/v23.0/${waPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${waToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const respJson = await resp.json();

      if (!resp.ok) {
        await supabase.from("billing_reminder_logs").insert([
          {
            customer_id: customer.id,
            channel: "whatsapp",
            reminder_type: "expiry_due",
            target_date: todayStr,
            status: "failed",
            error_message: JSON.stringify(respJson),
          },
        ]);

        results.push({
          customer: customer.customer_name,
          status: "failed",
          response: respJson,
        });

        continue;
      }

      const providerMessageId = respJson?.messages?.[0]?.id ?? null;

      await supabase.from("billing_reminder_logs").insert([
        {
          customer_id: customer.id,
          channel: "whatsapp",
          reminder_type: "expiry_due",
          target_date: todayStr,
          status: "sent",
          provider_message_id: providerMessageId,
        },
      ]);

      await supabase
        .from("billing_customers")
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq("id", customer.id);

      results.push({
        customer: customer.customer_name,
        status: "sent",
        providerMessageId,
      });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});