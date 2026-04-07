import { addCustomer } from "../../lib/billing-storage";
import { supabase } from "../../lib/supabase";
import { getPlans } from "../../lib/billing-plans";
import { getNextSerialNumber } from "../../lib/billing-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BillingCustomer } from "../../lib/billing-types";

type PlanOption = {
  id: string;
  name: string;
  price: number;
  validity_days: number;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type CustomPlanOption = {
  value: string;
  label: string;
};

function sanitizeDate(value?: string) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  if (value < "2000-01-01" || value > "2100-12-31") return "";
  return value;
}

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
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || "Something went wrong");
  }
  return "Something went wrong";
}

const customSelectWrapStyle: React.CSSProperties = {
  position: "relative",
};

const customSelectButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  borderRadius: 16,
  border: "1px solid rgba(244,114,182,0.18)",
  background: "rgba(2, 6, 23, 0.46)",
  color: "#ffffff",
  padding: "12px 44px 12px 14px",
  fontSize: 15,
  fontWeight: 700,
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  textAlign: "left",
};

const customSelectArrowStyle: React.CSSProperties = {
  position: "absolute",
  right: 14,
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "rgba(255,255,255,0.72)",
  fontSize: 13,
  fontWeight: 900,
};

const customSelectMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  left: 0,
  right: 0,
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.99) 0%, rgba(17,24,39,0.99) 100%)",
  border: "1px solid rgba(244,114,182,0.18)",
  borderRadius: 18,
  boxShadow: "0 22px 44px rgba(0,0,0,0.40)",
  zIndex: 999,
  backdropFilter: "blur(12px)",
  maxHeight: 280,
  overflowY: "auto",
};

const customSelectOptionStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  color: "#ffffff",
  textAlign: "left",
  padding: "13px 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const customSelectOptionActiveStyle: React.CSSProperties = {
  ...customSelectOptionStyle,
  background:
    "linear-gradient(135deg, rgba(217,70,239,0.18) 0%, rgba(236,72,153,0.16) 100%)",
  color: "#fdf2f8",
};

function CustomPlanDropdown({
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  value: string;
  options: CustomPlanOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label || "Select";

  return (
    <div style={customSelectWrapStyle}>
      <button type="button" onClick={onToggle} style={customSelectButtonStyle}>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            paddingRight: 8,
          }}
        >
          {selectedLabel}
        </span>
      </button>

      <span style={customSelectArrowStyle}>
        {isOpen ? "▲" : "▼"}
      </span>

      {isOpen && (
        <div style={customSelectMenuStyle}>
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                style={
                  active
                    ? customSelectOptionActiveStyle
                    : customSelectOptionStyle
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NewCustomerPage() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [toast, setToast] = useState<ToastState>(null);

  const [planMenuOpen, setPlanMenuOpen] = useState(false);
  const planMenuRef = useRef<HTMLDivElement | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [ispName, setIspName] = useState("Alliance");
  const [planId, setPlanId] = useState("");
  const [planName, setPlanName] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planValidity, setPlanValidity] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [totalDueAmount, setTotalDueAmount] = useState("");
  const [totalPaidAmount, setTotalPaidAmount] = useState("");
  const [copyNumber, setCopyNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [portalPassword, setPortalPassword] = useState("");

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (planMenuRef.current && !planMenuRef.current.contains(target)) {
        setPlanMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansData, nextSerial] = await Promise.all([
          getPlans(),
          getNextSerialNumber(),
        ]);

        setPlans(
          (plansData || []).map((p) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price || 0),
            validity_days: Number(p.validity_days || 30),
          }))
        );

        setSerialNumber(nextSerial);
      } catch (error) {
        console.error(error);
        showToast("error", getErrorMessage(error) || "Failed to load page data");
      }
    }

    loadData();
  }, []);

  function handlePlanChange(nextPlanId: string) {
    setPlanId(nextPlanId);
    setPlanMenuOpen(false);

    const selectedPlan = plans.find((p) => p.id === nextPlanId);
    if (!selectedPlan) return;

    setPlanName(selectedPlan.name || "");
    setPlanAmount(numberInputValue(selectedPlan.price));
    setPlanValidity(numberInputValue(selectedPlan.validity_days));
  }

  const planOptions = useMemo<CustomPlanOption[]>(() => {
    return plans.map((plan) => ({
      value: plan.id,
      label: `${plan.name} - ₹${plan.price} - ${plan.validity_days} days`,
    }));
  }, [plans]);

  const computedCurrentDue = useMemo(() => {
    const due = toNumber(totalDueAmount, 0) - toNumber(totalPaidAmount, 0);
    return Math.max(0, due);
  }, [totalDueAmount, totalPaidAmount]);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (mobileNumber.length !== 10) {
    alert("Mobile number must be exactly 10 digits");
    return;
  }

  if (!planId) {
    showToast("error", "Please select a plan");
    return;
  }

  if (!customerName.trim()) {
    showToast("error", "Customer name is required");
    return;
  }

  if (!mobileNumber.trim()) {
    showToast("error", "Mobile number is required");
    return;
  }

  setSaving(true);

  try {
    const totalDue = toNumber(totalDueAmount, 0);
    const totalPaid = toNumber(totalPaidAmount, 0);

    const finalSerial =
      String(serialNumber || "").trim() || (await getNextSerialNumber());

    const payload: Omit<
      BillingCustomer,
      "id" | "createdAt" | "updatedAt"
    > = {
      customerName: customerName.trim(),
      mobileNumber: mobileNumber.trim(),
      address: address.trim(),
      ispName: ispName.trim(),

      planId: planId || null, // ✅ important

      planName: planName.trim(),
      planAmount: toNumber(planAmount, 0),
      planValidity: toNumber(planValidity, 0),

      installationDate: sanitizeDate(installationDate),
      renewalDate: sanitizeDate(renewalDate),

      status: "active", // ✅ default safe

      portalPassword: portalPassword.trim() || mobileNumber.trim(),
    };

    console.log("FINAL PLAN ID:", payload.planId);

    await addCustomer(payload); // ✅ THIS WAS MISSING

    showToast("success", "Customer added successfully");

    setTimeout(() => {
      navigate("/admin/customers");
    }, 700);
  } catch (error) {
    console.error(error);
    showToast("error", getErrorMessage(error) || "Failed to add customer");
  } finally {
    setSaving(false);
  }
}


  return (
    <div>
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

          .aj-add-page-title {
            margin: 0 0 22px;
            font-size: 2rem;
            font-weight: 800;
            color: #fff7fb;
            text-shadow: 0 2px 14px rgba(217,70,239,0.28);
          }

          .aj-add-card {
            background: linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(30,41,59,0.62) 100%);
            border: 1px solid rgba(244,114,182,0.14);
            border-radius: 24px;
            padding: 20px;
            box-shadow: 0 16px 34px rgba(0,0,0,0.20);
            backdrop-filter: blur(10px);
          }

          .aj-add-card + .aj-add-card {
            margin-top: 20px;
          }

          .aj-add-section-title {
            margin: 0 0 14px;
            font-size: 1.05rem;
            font-weight: 800;
            color: #fff7fb;
          }

          .aj-add-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }

          .aj-add-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .aj-add-label {
            color: rgba(255,255,255,0.82);
            font-size: 13px;
            font-weight: 700;
          }

          .aj-add-input {
            width: 100%;
            background: rgba(2, 6, 23, 0.46);
            border: 1px solid rgba(244,114,182,0.18);
            color: #fff;
            border-radius: 16px;
            padding: 12px 14px;
            outline: none;
          }

          .aj-add-input::placeholder {
            color: rgba(255,255,255,0.4);
          }

          .aj-add-preview-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }

          .aj-add-preview-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 18px;
            padding: 14px;
          }

          .aj-add-preview-label {
            color: rgba(255,255,255,0.62);
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .aj-add-preview-value {
            color: #ffffff;
            font-size: 16px;
            font-weight: 800;
          }

          .aj-add-actions {
            display: flex;
            justify-content: flex-end;
          }

          .aj-add-save {
            padding: 14px 28px;
            border-radius: 18px;
            border: none;
            background: linear-gradient(135deg, #d946ef 0%, #ec4899 55%, #f472b6 100%);
            color: #ffffff;
            font-weight: 800;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 10px 24px rgba(217,70,239,0.24);
          }

          .aj-add-save:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          @media (max-width: 1100px) {
            .aj-add-grid,
            .aj-add-preview-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .aj-add-grid,
            .aj-add-preview-grid {
              grid-template-columns: 1fr;
            }
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

      <h1 className="aj-add-page-title">Add Customer</h1>

      <form onSubmit={handleSubmit}>
        <div
          className="aj-add-card"
          style={{ overflow: "visible", position: "relative", zIndex: 20 }}
        >
          <h2 className="aj-add-section-title">Customer Details</h2>

          <div className="aj-add-grid">
            <div className="aj-add-field">
              <label className="aj-add-label">Customer Name</label>
              <input
                className="aj-add-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Mobile Number</label>
<input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={10}
  placeholder="Enter 10 digit mobile number"
  value={mobileNumber}
  onChange={(e) => {
    const onlyNums = e.target.value.replace(/\D/g, "");
    setMobileNumber(onlyNums.slice(0, 10));
  }}
/>
              
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Address</label>
              <input
                className="aj-add-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
<div className="aj-add-field">
  <label className="aj-add-label">ISP Name</label>
  <input
    className="aj-add-input"
    value={ispName}
    onChange={(e) => setIspName(e.target.value)}
  />
</div>

<div
  className="aj-add-field"
  ref={planMenuRef}
  style={{ position: "relative", zIndex: 50 }}
>
  <label className="aj-add-label">Select Plan</label>
  <CustomPlanDropdown
    value={planId}
    options={planOptions}
    isOpen={planMenuOpen}
    onToggle={() => setPlanMenuOpen((prev) => !prev)}
    onSelect={handlePlanChange}
  />
</div>


            <div className="aj-add-field">
              <label className="aj-add-label">Plan Name</label>
              <input
                className="aj-add-input"
                value={planName}
                readOnly
                disabled
                style={{
                  opacity: 0.8,
                  cursor: "not-allowed",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Plan Amount</label>
              <input
                type="text"
                inputMode="decimal"
                className="aj-add-input"
                value={planAmount}
                readOnly
                disabled
                style={{
                  opacity: 0.8,
                  cursor: "not-allowed",
                  background: "rgba(255,255,255,0.06)",
                }}
                placeholder="Auto from selected plan"
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Plan Validity (Days)</label>
              <input
                type="text"
                inputMode="numeric"
                className="aj-add-input"
                value={planValidity}
                readOnly
                disabled
                style={{
                  opacity: 0.8,
                  cursor: "not-allowed",
                  background: "rgba(255,255,255,0.06)",
                }}
                placeholder="Auto from selected plan"
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Installation Date</label>
              <input
                type="date"
                className="aj-add-input"
                value={installationDate}
                onChange={(e) => setInstallationDate(e.target.value)}
                min="2000-01-01"
                max="2100-12-31"
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Renewal Date</label>
              <input
                type="date"
                className="aj-add-input"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                min="2000-01-01"
                max="2100-12-31"
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Payment Date</label>
              <input
                type="date"
                className="aj-add-input"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                min="2000-01-01"
                max="2100-12-31"
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Total Due Amount</label>
              <input
                type="text"
                inputMode="decimal"
                className="aj-add-input"
                value={totalDueAmount}
                onChange={(e) => setTotalDueAmount(e.target.value)}
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Total Paid Amount</label>
              <input
                type="text"
                inputMode="decimal"
                className="aj-add-input"
                value={totalPaidAmount}
                onChange={(e) => setTotalPaidAmount(e.target.value)}
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Current Due Amount</label>
              <input
                type="text"
                inputMode="decimal"
                className="aj-add-input"
                value={numberInputValue(computedCurrentDue)}
                readOnly
                disabled
                style={{
                  opacity: 0.8,
                  cursor: "not-allowed",
                  background: "rgba(255,255,255,0.06)",
                }}
                placeholder="Auto calculated"
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Copy Number</label>
              <input
                type="text"
                inputMode="numeric"
                className="aj-add-input"
                value={copyNumber}
                onChange={(e) => setCopyNumber(e.target.value)}
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Serial Number</label>
              <input
                type="text"
                className="aj-add-input"
                value={serialNumber}
                readOnly
                disabled
                style={{
                  opacity: 0.8,
                  cursor: "not-allowed",
                  background: "rgba(255,255,255,0.06)",
                }}
                placeholder="Auto generated"
              />
            </div>

            <div className="aj-add-field">
              <label className="aj-add-label">Portal Password</label>
              <input
                className="aj-add-input"
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
                placeholder="Defaults to mobile number"
              />
            </div>
          </div>
        </div>

        <div className="aj-add-card">
          <h2 className="aj-add-section-title">Preview</h2>

          <div className="aj-add-preview-grid">
            <div className="aj-add-preview-card">
              <div className="aj-add-preview-label">Current Due</div>
              <div className="aj-add-preview-value">₹{computedCurrentDue}</div>
            </div>

            <div className="aj-add-preview-card">
              <div className="aj-add-preview-label">Plan Amount</div>
              <div className="aj-add-preview-value">₹{toNumber(planAmount, 0)}</div>
            </div>

            <div className="aj-add-preview-card">
              <div className="aj-add-preview-label">Plan Validity</div>
              <div className="aj-add-preview-value">
                {toNumber(planValidity, 0) > 0 ? `${toNumber(planValidity, 0)} days` : "-"}
              </div>
            </div>

            <div className="aj-add-preview-card">
              <div className="aj-add-preview-label">Serial Number</div>
              <div className="aj-add-preview-value">{serialNumber || "-"}</div>
            </div>
          </div>
        </div>

        <div className="aj-add-card">
          <div className="aj-add-actions">
            <button type="submit" className="aj-add-save" disabled={saving}>
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

}
