
import { useEffect, useState } from "react";
import {
  addPlan,
  deletePlan,
  getPlans,
  updatePlan,
  type BillingPlan,
} from "../../lib/billing-plans";

type PlanForm = {
  name: string;
  speed: string;
  price: string;
  validity_days: string;
  description: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const emptyForm: PlanForm = {
  name: "",
  speed: "",
  price: "",
  validity_days: "",
  description: "",
};

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
  padding: "12px 18px",
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(135deg, #d946ef 0%, #ec4899 55%, #f472b6 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(217,70,239,0.24)",
};

const secondaryBtn: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 16,
  border: "1px solid rgba(236,72,153,0.20)",
  background: "rgba(253,242,248,0.96)",
  color: "#be185d",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};

const smallSecondaryBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid rgba(236,72,153,0.20)",
  background: "rgba(253,242,248,0.96)",
  color: "#be185d",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const smallDangerBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid rgba(244,63,94,0.28)",
  background: "rgba(190,24,93,0.12)",
  color: "#fb7185",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const smallSuccessBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid rgba(16,185,129,0.25)",
  background: "rgba(236,253,245,0.98)",
  color: "#059669",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function numberInputValue(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return "";
  return String(num);
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    if ("message" in error && error.message) {
      return String(error.message);
    }
    if ("error_description" in error && error.error_description) {
      return String(error.error_description);
    }
    if ("details" in error && error.details) {
      return String(error.details);
    }
    if ("hint" in error && error.hint) {
      return String(error.hint);
    }
  }
  return "Something went wrong";
}

export default function PlansPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [toast, setToast] = useState<ToastState>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }
async function loadPlans() {
  setLoading(true);
  try {
    const data = await getPlans();
    console.log("Supabase plans:", data); // debug
    setPlans(data || []);
  } catch (error) {
    console.error("Failed to load plans:", error);
    showToast("error", "Failed to load plans");
    setPlans([]);
  } finally {
    setLoading(false);
  }
}
  

  useEffect(() => {
    loadPlans();
  }, []);

  function setField<K extends keyof PlanForm>(key: K, value: PlanForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleEdit(plan: BillingPlan) {
    setEditingId(plan.id);
    setConfirmDeleteId(null);
    setForm({
      name: plan.name || "",
      speed: plan.speed || "",
      price: numberInputValue(plan.price),
      validity_days: numberInputValue(plan.validity_days),
      description: plan.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(plan: BillingPlan) {
    try {
      setDeletingId(plan.id);
      await deletePlan(plan.id);
      showToast("success", "Plan deleted successfully");
      setConfirmDeleteId(null);
      await loadPlans();

      if (editingId === plan.id) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Failed to delete plan:", error);
      showToast("error", getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("error", "Plan name is required");
      return;
    }

    if (toNumber(form.price, 0) <= 0) {
      showToast("error", "Plan price must be greater than 0");
      return;
    }

    if (toNumber(form.validity_days, 0) <= 0) {
      showToast("error", "Validity days must be greater than 0");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        speed: form.speed.trim(),
        price: toNumber(form.price, 0),
        validity_days: toNumber(form.validity_days, 0),
        description: form.description.trim(),
      };

      if (editingId) {
        await updatePlan(editingId, payload);
        showToast("success", "Plan updated successfully");
      } else {
        await addPlan(payload);
        showToast("success", "Plan created successfully");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadPlans();
    } catch (error) {
      console.error("Failed to save plan:", error);
      showToast("error", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="billing-grid" style={{ gap: "20px", position: "relative" }}>
      <style>
        {`
          .aj-toast-wrap {
            position: sticky;
            top: 14px;
            z-index: 60;
            display: flex;
            justify-content: flex-end;
            pointer-events: none;
            margin-bottom: 8px;
          }

          .aj-toast {
            min-width: 260px;
            max-width: 420px;
            border-radius: 18px;
            padding: 14px 16px;
            color: white;
            font-weight: 700;
            box-shadow: 0 18px 42px rgba(0,0,0,0.28);
            border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(14px);
            pointer-events: auto;
          }

          .aj-toast-success {
            background: linear-gradient(135deg, rgba(16,185,129,0.92), rgba(5,150,105,0.92));
          }

          .aj-toast-error {
            background: linear-gradient(135deg, rgba(225,29,72,0.92), rgba(190,24,93,0.92));
          }
        `}
      </style>

      {toast && (
        <div className="aj-toast-wrap">
          <div
            className={`aj-toast ${
              toast.type === "success" ? "aj-toast-success" : "aj-toast-error"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <section style={sectionCardStyle}>
        <h1
          className="billing-page-title"
          style={{
            marginBottom: 8,
            color: "#fff7fb",
            textShadow: "0 2px 14px rgba(217,70,239,0.28)",
          }}
        >
          Broadband Plans
        </h1>
        <p
          className="billing-page-subtitle"
          style={{
            color: "rgba(255,255,255,0.78)",
            margin: 0,
          }}
        >
          Create, edit and manage your broadband plans with price and validity.
        </p>
      </section>

      <section style={sectionCardStyle}>
        <h2
          className="billing-section-title"
          style={{
            color: "#fdf2f8",
            marginBottom: 0,
          }}
        >
          {editingId ? "Edit Plan" : "Create New Plan"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            <div className="billing-form-group">
              <label className="billing-label" style={{ color: "rgba(255,255,255,0.78)" }}>
                Plan Name
              </label>
              <input
                className="billing-input"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Gold Plan"
                style={inputStyle}
              />
            </div>

            <div className="billing-form-group">
              <label className="billing-label" style={{ color: "rgba(255,255,255,0.78)" }}>
                Speed
              </label>
              <input
                className="billing-input"
                value={form.speed}
                onChange={(e) => setField("speed", e.target.value)}
                placeholder="e.g. 200 Mbps"
                style={inputStyle}
              />
            </div>

            <div className="billing-form-group">
              <label className="billing-label" style={{ color: "rgba(255,255,255,0.78)" }}>
                Price
              </label>
              <input
                type="text"
                inputMode="decimal"
                className="billing-input"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="e.g. 799"
                style={inputStyle}
              />
            </div>

            <div className="billing-form-group">
              <label className="billing-label" style={{ color: "rgba(255,255,255,0.78)" }}>
                Validity (Days)
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="billing-input"
                value={form.validity_days}
                onChange={(e) => setField("validity_days", e.target.value)}
                placeholder="e.g. 30"
                style={inputStyle}
              />
            </div>

            <div className="billing-form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="billing-label" style={{ color: "rgba(255,255,255,0.78)" }}>
                Description
              </label>
              <input
                className="billing-input"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Optional description"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={secondaryBtn}>
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...primaryBtn,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : editingId ? "Update Plan" : "Create Plan"}
            </button>
          </div>
        </form>
      </section>

      <section style={sectionCardStyle}>
        <h2
          className="billing-section-title"
          style={{
            color: "#fdf2f8",
            marginBottom: 0,
          }}
        >
          Existing Plans
        </h2>

        <div style={{ marginTop: "16px" }}>
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.72)" }}>Loading plans...</div>
          ) : (
            <div
              style={{
                overflowX: "auto",
                borderRadius: 18,
                border: "1px solid rgba(244,114,182,0.12)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 900,
                  background: "rgba(2, 6, 23, 0.24)",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "rgba(15, 23, 42, 0.48)",
                    }}
                  >
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Speed</th>
                    <th style={thStyle}>Price</th>
                    <th style={thStyle}>Validity</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          color: "rgba(255,255,255,.65)",
                          padding: 20,
                        }}
                      >
                        No plans found
                      </td>
                    </tr>
                  ) : (
                    plans.map((p) => (
                      <tr
                        key={p.id}
                        style={{
                          borderTop: "1px solid rgba(244,114,182,0.10)",
                          background:
                            editingId === p.id
                              ? "rgba(217,70,239,0.12)"
                              : "rgba(2, 6, 23, 0.08)",
                        }}
                      >
                        <td style={tdStyle}>{p.name}</td>
                        <td style={tdStyle}>{p.speed || "-"}</td>
                        <td style={tdStyle}>₹{p.price}</td>
                        <td style={tdStyle}>{p.validity_days} days</td>
                        <td style={tdStyle}>{p.description || "-"}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(p)}
                              style={smallSecondaryBtn}
                            >
                              Edit
                            </button>

                            {confirmDeleteId === p.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p)}
                                  disabled={deletingId === p.id}
                                  style={{
                                    ...smallSuccessBtn,
                                    opacity: deletingId === p.id ? 0.7 : 1,
                                  }}
                                >
                                  {deletingId === p.id ? "Deleting..." : "Confirm"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  style={smallDangerBtn}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(p.id)}
                                style={smallDangerBtn}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "14px 14px",
  textAlign: "left",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: "#fdf2f8",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 14px",
  fontSize: 15,
  color: "#ffffff",
  verticalAlign: "middle",
};