import { useEffect, useState } from "react";
import type { BillingCustomer } from "../lib/billing-types";
import { getPlans, type BillingPlan } from "../lib/billing-plans";

type Props = {
  initialData?: BillingCustomer | null;
  onSubmit: (data: BillingCustomer) => void | Promise<void>;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="billing-form-group">
      <label
        className="billing-label"
        style={{ color: "rgba(255,255,255,0.78)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const sectionCardStyle: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(30,41,59,0.62) 100%)",
  border: "1px solid rgba(244,114,182,0.14)",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 16px 34px rgba(0,0,0,0.20)",
  backdropFilter: "blur(10px)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(2, 6, 23, 0.46)",
  border: "1px solid rgba(244,114,182,0.18)",
  color: "#fff",
  borderRadius: 16,
};

const primaryBtn: React.CSSProperties = {
  padding: "14px 26px",
  fontSize: "16px",
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(135deg, #d946ef 0%, #ec4899 55%, #f472b6 100%)",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(217,70,239,0.24)",
};

function sanitizeDate(value?: string) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  if (value < "2000-01-01" || value > "2100-12-31") return "";
  return value;
}

export default function CustomerForm({ initialData, onSubmit }: Props) {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<BillingCustomer>(
    initialData || {
      id: crypto.randomUUID(),
      customerName: "",
      address: "",
      mobileNumber: "",
      installationDate: "",
      renewalDate: "",
      paymentDate: "",
      totalDueAmount: 0,
      currentDueAmount: 0,
      totalPaidAmount: 0,
      planId: "",
      planName: "",
      planAmount: 0,
      planValidity: 30,
      ispName: "",
      copyNumber: "",
      serialNumber: "",
      portalPassword: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  // ✅ LOAD PLANS (FIXED CLEAN)
  useEffect(() => {
    async function loadPlans() {
      try {
        const data = await getPlans();
        setPlans(data);
      } catch (error) {
        console.error("Failed to load plans:", error);
      }
    }

    loadPlans();
  }, []);

  function setField<K extends keyof BillingCustomer>(
    key: K,
    value: BillingCustomer[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const computedCurrentDue = Math.max(
        0,
        Number(form.totalDueAmount || 0) -
          Number(form.totalPaidAmount || 0)
      );

      await onSubmit({
        ...form,
        installationDate: sanitizeDate(form.installationDate),
        renewalDate: sanitizeDate(form.renewalDate),
        paymentDate: sanitizeDate(form.paymentDate),
        totalDueAmount: Number(form.totalDueAmount || 0),
        totalPaidAmount: Number(form.totalPaidAmount || 0),
        currentDueAmount: computedCurrentDue,
        planAmount: Number(form.planAmount || 0),
        planValidity: Number(form.planValidity || 30),
      });
    } finally {
      setSaving(false);
    }
  }

  const selectedPlanId =
    plans.find(
      (p) =>
        p.name === form.planName &&
        Number(p.price) === Number(form.planAmount) &&
        Number(p.validity_days) ===
          Number(form.planValidity || 30)
    )?.id || form.planId || "";

  return (
    <form onSubmit={handleSubmit}>
      <div style={sectionCardStyle}>
        <h2
          className="billing-section-title"
          style={{ color: "#fdf2f8" }}
        >
          Customer Details
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          <Field label="Customer Name">
            <input
              className="billing-input"
              value={form.customerName}
              onChange={(e) =>
                setField("customerName", e.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Mobile Number">
            <input
              className="billing-input"
              value={form.mobileNumber}
              onChange={(e) =>
                setField("mobileNumber", e.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Address">
            <input
              className="billing-input"
              value={form.address}
              onChange={(e) =>
                setField("address", e.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="ISP Name">
            <input
              className="billing-input"
              value={form.ispName}
              onChange={(e) =>
                setField("ispName", e.target.value)
              }
              style={inputStyle}
            />
          </Field>

          {/* ✅ PLAN DROPDOWN */}
          <Field label="Select Plan">
            <select
              className="billing-input"
              value={selectedPlanId}
              onChange={(e) => {
                const selected = plans.find(
                  (p) => p.id === e.target.value
                );
                if (!selected) return;

                setForm((prev) => ({
                  ...prev,
                  planId: selected.id,
                  planName: selected.name,
                  planAmount: Number(selected.price),
                  planValidity: Number(
                    selected.validity_days
                  ),
                  updatedAt: new Date().toISOString(),
                }));
              }}
              style={inputStyle}
            >
              <option value="">Select Plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.speed} - ₹{plan.price}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Plan Name">
            <input
              className="billing-input"
              value={form.planName || ""}
              readOnly
              style={inputStyle}
            />
          </Field>

          <Field label="Plan Amount">
            <input
              className="billing-input"
              value={form.planAmount || 0}
              readOnly
              style={inputStyle}
            />
          </Field>

          <Field label="Plan Validity (Days)">
            <input
              className="billing-input"
              value={form.planValidity || 30}
              readOnly
              style={inputStyle}
            />
          </Field>

          <Field label="Installation Date">
            <input
              type="date"
              className="billing-input"
              value={form.installationDate || ""}
              onChange={(e) =>
                setField("installationDate", e.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Renewal Date">
            <input
              type="date"
              className="billing-input"
              value={form.renewalDate || ""}
              onChange={(e) =>
                setField("renewalDate", e.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Payment Date">
            <input
              type="date"
              className="billing-input"
              value={form.paymentDate || ""}
              onChange={(e) =>
                setField("paymentDate", e.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Total Due Amount">
            <input
              type="number"
              className="billing-input"
              value={form.totalDueAmount || 0}
              onChange={(e) =>
                setField("totalDueAmount", Number(e.target.value))
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Total Paid Amount">
            <input
              type="number"
              className="billing-input"
              value={form.totalPaidAmount || 0}
              onChange={(e) =>
                setField("totalPaidAmount", Number(e.target.value))
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Current Due Amount">
            <input
              className="billing-input"
              value={Math.max(
                0,
                Number(form.totalDueAmount || 0) -
                  Number(form.totalPaidAmount || 0)
              )}
              readOnly
              style={inputStyle}
            />
          </Field>

          <Field label="Copy Number">
            <input
              className="billing-input"
              value={form.copyNumber}
              onChange={(e) =>
                setField("copyNumber", e.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Serial Number">
            <input
              className="billing-input"
              value={form.serialNumber || ""}
              readOnly
              disabled
              style={{
                ...inputStyle,
                opacity: 0.7,
                cursor: "not-allowed",
              }}
            />
          </Field>

          <Field label="Portal Password">
            <input
              className="billing-input"
              value={form.portalPassword}
              onChange={(e) =>
                setField("portalPassword", e.target.value)
              }
              style={inputStyle}
            />
          </Field>
        </div>
      </div>

      <div
        style={{
          ...sectionCardStyle,
          marginTop: "20px",
          textAlign: "right",
        }}
      >
        <button type="submit" disabled={saving} style={primaryBtn}>
          {saving ? "Saving..." : "Save Customer"}
        </button>
      </div>
    </form>
  );
}