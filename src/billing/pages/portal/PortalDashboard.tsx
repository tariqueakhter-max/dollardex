import { getInvoices } from "../../lib/invoiceService";
import { markInvoicePaid } from "../../lib/invoiceService";
import { generateInvoicePDF } from "../../lib/pdfService";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPortalCustomerId, logoutPortal } from "../../lib/billing-auth";
import { getCustomerById } from "../../lib/billing-storage";
import type { BillingCustomer } from "../../lib/billing-types";
import { formatDateDisplay } from "../../lib/date-utils";
import { supabase } from "../../lib/supabase";

function formatCurrency(value: unknown) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
}

function safeText(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function getDaysRemaining(expiryDate?: string) {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

  const diffMs = end.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getDaysSinceRenewal(renewalDate?: string) {
  if (!renewalDate) return null;
  const renewal = new Date(renewalDate);
  if (Number.isNaN(renewal.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(renewal.getFullYear(), renewal.getMonth(), renewal.getDate());

  const diffMs = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function getExpiryTone(daysRemaining: number | null): "default" | "success" | "warning" | "danger" {
  if (daysRemaining === null) return "default";
  if (daysRemaining < 0) return "danger";
  if (daysRemaining <= 7) return "warning";
  return "success";
}

function getExpiryBadgeText(daysRemaining: number | null) {
  if (daysRemaining === null) return "N/A";
  if (daysRemaining < 0) return "Expired";
  if (daysRemaining === 0) return "Expires Today";
  if (daysRemaining === 1) return "1 Day Left";
  return `${daysRemaining} Days Left`;
}

function InfoCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className={`aj-portal-info-card aj-tone-${tone}`}>
      <div className="aj-portal-info-label">{label}</div>
      <div className="aj-portal-info-value">{value || "-"}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className="aj-portal-detail-row">
      <span className="aj-portal-detail-label">{label}</span>
      <span className={`aj-portal-detail-value aj-detail-${accent}`}>{value || "-"}</span>
    </div>
  );
}

export default function PortalDashboard() {
  
const navigate = useNavigate();
  const [customer, setCustomer] = useState<BillingCustomer | null>(null);
const [invoices, setInvoices] = useState<any[]>([]);

useEffect(() => {
  if (!customer?.id) return;

  loadInvoices();
}, [customer]);

async function loadInvoices() {
  if (!customer) return;

  const data = await getInvoices(customer.id);
  setInvoices(data || []);
}
  const [loading, setLoading] = useState(true);
// ✅ CALCULATED VALUES (IMPORTANT)

const daysRemaining = getDaysRemaining(customer?.renewalDate);
const expiryTone = getExpiryTone(daysRemaining);
const expiryBadgeText = getExpiryBadgeText(daysRemaining);

// status
const statusText =
  daysRemaining === null
    ? "-"
    : daysRemaining < 0
    ? "Expired"
    : daysRemaining <= 3
    ? "Expiring"
    : "Active";

const statusTone =
  daysRemaining === null
    ? "default"
    : daysRemaining < 0
    ? "danger"
    : daysRemaining <= 3
    ? "warning"
    : "success";

// cycle calculation
const totalCycleDays = Math.max(30, daysRemaining || 30);
// prevent overflow (VERY IMPORTANT)
const safeDaysRemaining = Math.max(0, Math.min(daysRemaining ?? 0, totalCycleDays));

const usedDays = totalCycleDays - safeDaysRemaining;

const ringPercent = Math.min(
  100,
  Math.max(0, (usedDays / totalCycleDays) * 100)
);


const ringStroke =
  expiryTone === "danger"
    ? "#ef4444"
    : expiryTone === "warning"
    ? "#f59e0b"
    : "#22c55e";

  useEffect(() => {
    async function loadCustomer() {
      const customerId = getPortalCustomerId();

      if (!customerId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCustomerById(customerId);
        setCustomer(data);
      } catch (error) {
        console.error("Failed to load portal customer:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, []);

 function handleLogout() {
  logoutPortal();
  navigate("/ajcomputers_billing/portal/login");
}

// ✅ Separate function (VERY IMPORTANT)
async function handlePayment() {
  if (!customer) return;

const amount = Number(customer.totalDueAmount || 0);
  if (amount <= 0) {
    alert("No due amount");
    return;
  }

  const options = {
    key: "rzp_test_SYZNfTr1WFpvt1",
    amount: amount * 100,
    currency: "INR",
    name: "AJ Computers",
    description: "Internet Bill Payment",

    handler: async function () {
      alert("Payment Successful");
      const { error } = await supabase
        .from("billing_customers")
        .update({
          total_due_amount: 0,
          total_paid_amount:
            Number(customer.totalPaidAmount || 0) + amount,
          payment_date: new Date().toISOString(),
        })
        .eq("id", customer.id);

      if (error) {
        alert("Update failed");
        return;
      }

      for (const inv of invoices) {
        if (inv.status === "unpaid") {
          await markInvoicePaid(inv.id);
        }
      }

      const updated = await getCustomerById(customer.id);
      setCustomer(updated);
await loadInvoices();
    }, // ✅ CLOSE handler properly
  };   // ✅ CLOSE options object

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}

if (loading) {
  return (
    <div className="aj-portal-loading-page">
      <div className="aj-portal-loading-card">
        Loading customer data...
      </div>
    </div>
  );
}

  if (!customer) {
    return (
      <>

        <style>{`
          .aj-portal-empty-page {
            min-height: 50vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 0;
          }

          .aj-portal-empty-card {
            width: 100%;
            max-width: 560px;
            border-radius: 24px;
            padding: 24px 18px;
            text-align: center;
            color: #fff7fc;
            border: 1px solid rgba(255,255,255,0.12);
            background: linear-gradient(135deg, rgba(24, 12, 34, 0.94), rgba(49, 16, 56, 0.84));
            box-shadow: 0 20px 48px rgba(0,0,0,0.28);
          }

          .aj-portal-empty-title {
            margin: 0 0 8px;
            font-size: 1.4rem;
            font-weight: 800;
          }

          .aj-portal-empty-text {
            margin: 0 0 16px;
            color: rgba(255,235,247,0.78);
            line-height: 1.7;
          }

          .aj-portal-empty-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 46px;
            padding: 0 18px;
            border-radius: 999px;
            text-decoration: none;
            font-weight: 700;
            color: white;
            background: linear-gradient(135deg, #a855f7, #ec4899);
          }
        `}</style>

        <div className="aj-portal-empty-page">
          <div className="aj-portal-empty-card">
            <h2 className="aj-portal-empty-title">Customer not found</h2>
            <p className="aj-portal-empty-text">
              You are not logged in or your customer record could not be loaded.
            </p>
            <Link
              to="/ajcomputers_billing/portal/login"
              className="aj-portal-empty-link"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .aj-portal-page {
          position: relative;
          overflow: hidden;
          padding: 16px 0 28px;
        }

        .aj-portal-page::before,
        .aj-portal-page::after {
          content: "";
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          pointer-events: none;
          z-index: 0;
        }

        .aj-portal-page::before {
          width: 240px;
          height: 240px;
          top: -30px;
          left: -90px;
          background: rgba(168, 85, 247, 0.16);
        }

        .aj-portal-page::after {
          width: 280px;
          height: 280px;
          right: -110px;
          top: 180px;
          background: rgba(236, 72, 153, 0.16);
        }

        .aj-portal-shell {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 16px;
        }

        .aj-portal-glass {
          position: relative;
          overflow: hidden;
          border-radius: 26px;
          border: 1px solid rgba(255,255,255,0.12);
          background: linear-gradient(135deg, rgba(18,22,48,0.95), rgba(48,15,56,0.84));
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow:
            0 22px 52px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .aj-portal-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 30%),
            linear-gradient(180deg, rgba(255,255,255,0.04), transparent 42%);
          pointer-events: none;
        }

        .aj-portal-hero {
          padding: 20px 16px;
        }

        .aj-portal-hero-inner {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 18px;
        }

        .aj-portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          color: #e9d5ff;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .aj-portal-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
        }

        .aj-portal-title {
          margin: 0;
          font-size: clamp(1.8rem, 6vw, 2.9rem);
          line-height: 1.05;
          font-weight: 800;
          color: white;
        }

        .aj-portal-title span {
          background: linear-gradient(135deg, #a855f7, #ec4899, #ffffff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .aj-portal-subtitle {
          margin: 10px 0 0;
          color: rgba(255,255,255,0.76);
          font-size: 14px;
          line-height: 1.75;
          max-width: 760px;
        }

        .aj-portal-customer-name {
          font-weight: 900;
          background: linear-gradient(135deg, #f5c86b 0%, #86efac 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .aj-portal-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .aj-portal-btn,
        .aj-portal-link-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 18px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          border: 0;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .aj-portal-btn:hover,
        .aj-portal-link-btn:hover {
          transform: translateY(-1px);
        }

        .aj-portal-btn-primary {
          color: white;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          box-shadow: 0 16px 34px rgba(217, 70, 239, 0.28);
        }

        .aj-portal-btn-secondary {
          color: #fff7fc;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .aj-portal-summary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .aj-portal-info-card {
          border-radius: 22px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          min-height: 100%;
        }

        .aj-portal-info-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.62);
          margin-bottom: 8px;
        }

        .aj-portal-info-value {
          font-size: 1.35rem;
          line-height: 1.25;
          font-weight: 800;
          color: white;
          word-break: break-word;
        }

        .aj-tone-success {
          background: linear-gradient(135deg, rgba(34,197,94,0.16), rgba(255,255,255,0.04));
        }

        .aj-tone-warning {
          background: linear-gradient(135deg, rgba(245,158,11,0.18), rgba(255,255,255,0.04));
        }

        .aj-tone-danger {
          background: linear-gradient(135deg, rgba(239,68,68,0.18), rgba(255,255,255,0.04));
        }

        .aj-portal-grid-two {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .aj-portal-section {
          padding: 18px 16px;
        }

        .aj-portal-section-inner {
          position: relative;
          z-index: 1;
        }

        .aj-portal-section-kicker {
          margin: 0 0 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #f0abfc;
        }

        .aj-portal-section-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
        }

        .aj-portal-section-text {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255,255,255,0.74);
        }

        .aj-portal-detail-list {
          margin-top: 16px;
          display: grid;
          gap: 10px;
        }

        .aj-portal-detail-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .aj-portal-detail-label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.64);
        }

        .aj-portal-detail-value {
          font-size: 14px;
          font-weight: 700;
          color: #fff7fc;
          word-break: break-word;
        }

        .aj-detail-success {
          color: #86efac;
        }

        .aj-detail-warning {
          color: #fbbf24;
        }

        .aj-detail-danger {
          color: #f87171;
        }

        .aj-portal-countdown-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.03em;
          width: fit-content;
          margin-top: 12px;
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 10px 24px rgba(0,0,0,0.18);
        }

        .aj-countdown-success {
          background: linear-gradient(135deg, rgba(34,197,94,0.22), rgba(16,185,129,0.18));
          color: #bbf7d0;
        }

        .aj-countdown-warning {
          background: linear-gradient(135deg, rgba(245,158,11,0.24), rgba(251,191,36,0.18));
          color: #fde68a;
        }

        .aj-countdown-danger {
          background: linear-gradient(135deg, rgba(239,68,68,0.24), rgba(244,63,94,0.18));
          color: #fecdd3;
        }

        .aj-countdown-default {
          background: rgba(255,255,255,0.08);
          color: #fff7fc;
        }

        .aj-portal-ring-wrap {
          display: grid;
          place-items: center;
        }

        .aj-portal-ring-card {
          position: relative;
          width: 172px;
          height: 172px;
          display: grid;
          place-items: center;
        }

        .aj-portal-ring-svg {
          width: 172px;
          height: 172px;
          transform: rotate(-90deg);
          overflow: visible;
        }

        .aj-portal-ring-bg {
          fill: none;
          stroke: rgba(255,255,255,0.08);
          stroke-width: 10;
        }

        .aj-portal-ring-progress {
          fill: none;
          stroke-width: 10;
          stroke-linecap: round;
          filter: drop-shadow(0 0 10px rgba(245, 200, 107, 0.35));
          transition: stroke-dashoffset 0.4s ease;
        }

        .aj-portal-ring-inner {
          position: absolute;
          inset: 18px;
          border-radius: 999px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), transparent 45%),
            linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
        }

        .aj-portal-ring-value {
          font-size: 2rem;
          line-height: 1;
          font-weight: 900;
          color: #f5c86b;
          text-shadow: 0 0 14px rgba(245, 200, 107, 0.18);
        }

        .aj-portal-ring-unit {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,240,220,0.75);
        }

        .aj-portal-ring-caption {
          margin-top: 10px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.72);
          line-height: 1.5;
          max-width: 200px;
        }

        @media (min-width: 640px) {
          .aj-portal-page {
            padding: 22px 0 34px;
          }

          .aj-portal-hero {
            padding: 24px 22px;
          }

          .aj-portal-section {
            padding: 22px;
          }

          .aj-portal-actions {
            grid-template-columns: repeat(2, minmax(0, auto));
            justify-content: start;
          }

          .aj-portal-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .aj-portal-detail-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
          }

          .aj-portal-detail-value {
            text-align: right;
          }
        }

        @media (min-width: 960px) {
          .aj-portal-shell {
            gap: 18px;
          }

          .aj-portal-hero-inner {
            grid-template-columns: minmax(0, 1.2fr) auto;
            align-items: center;
          }

          .aj-portal-summary-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }

          .aj-portal-grid-two {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      <div className="aj-portal-page">
        <div className="aj-portal-shell">
          <section className="aj-portal-glass aj-portal-hero">
            <div className="aj-portal-hero-inner">
              <div>
                <div className="aj-portal-badge">
                  <span className="aj-portal-badge-dot" />
                  Customer Portal
                </div>

                <h1 className="aj-portal-title">
                  My Billing <span>Dashboard</span>
                </h1>
                <p className="aj-portal-subtitle">
                  Welcome,{" "}
                  <span className="aj-portal-customer-name">
                    {safeText(customer.customerName)}
                  </span>
                  . View your billing, renewal, payment, and account details in one clean dashboard.
                </p>

                <div
                  className={`aj-portal-countdown-badge ${
                    expiryTone === "success"
                      ? "aj-countdown-success"
                      : expiryTone === "warning"
                      ? "aj-countdown-warning"
                      : expiryTone === "danger"
                      ? "aj-countdown-danger"
                      : "aj-countdown-default"
                  }`}
                >
                  {expiryBadgeText}
                </div>
              </div>

              <div className="aj-portal-ring-wrap">
                <div className="aj-portal-ring-card">
                  <svg className="aj-portal-ring-svg" viewBox="0 0 172 172" aria-hidden="true">
                    <circle className="aj-portal-ring-bg" cx="86" cy="86" r="68" />
                    <circle
                      className="aj-portal-ring-progress"
                      cx="86"
                      cy="86"
                      r="68"
                      stroke={ringStroke}
                      strokeDasharray={2 * Math.PI * 68}
                      strokeDashoffset={(2 * Math.PI * 68) * (1 - ringPercent / 100)}
                    />
                  </svg>

                  <div className="aj-portal-ring-inner">
                    <div className="aj-portal-ring-value">
                      {daysRemaining === null ? "-" : daysRemaining < 0 ? 0 : daysRemaining}
                    </div>
                    <div className="aj-portal-ring-unit">Days Left</div>
                  </div>
                </div>

                <div className="aj-portal-ring-caption">
                  Expiry Progress Ring
                  <br />
{daysRemaining ? `${daysRemaining} days remaining` : "No expiry data"}
                </div>
              </div>
<div className="aj-portal-actions">

  {Number(customer.totalDueAmount) > 0 && (
    <button
      onClick={handlePayment}
      className="aj-portal-btn aj-portal-btn-primary"
      type="button"
    >
Pay ₹{Number(customer.totalDueAmount || 0)}
    </button>
  )}

  <Link
    to="/ajcomputers_billing/portal/change-password"
    className="aj-portal-link-btn aj-portal-btn-secondary"
  >
    Change Password
  </Link>

  <button
    onClick={handleLogout}
    className="aj-portal-btn aj-portal-btn-primary"
    type="button"
  >
    Logout
  </button>
</div>
</div>
</section>

<div className="aj-portal-glass aj-portal-section" style={{ marginTop: 20 }}>
  <div className="aj-portal-section-inner">

    <p className="aj-portal-section-kicker">Billing</p>
    <h2 className="aj-portal-section-title">Billing History</h2>

    {invoices.length === 0 ? (
      <p style={{ color: "#aaa" }}>No invoices yet</p>
    ) : (
      <table style={{ width: "100%", marginTop: 10, color: "#fff" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #444" }}>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td>{formatDateDisplay(inv.billing_date || inv.created_at)}</td>
              <td>₹{inv.amount}</td>

              <td
                style={{
                  color: inv.status === "paid" ? "#22c55e" : "#f59e0b",
                }}
              >
                {inv.status}
              </td>

              <td>
                <button
                  onClick={() => generateInvoicePDF(inv, customer)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: "#9333ea",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}

  </div>
</div>

          <section className="aj-portal-summary-grid">
            <InfoCard label="Current Status" value={statusText} tone={statusTone} />
            <InfoCard
              label="Current Due Amount"
value={formatCurrency(customer.totalDueAmount)}
              tone={statusTone}
            />
            <InfoCard
              label="Plan Amount"
              value={formatCurrency(customer.planAmount)}
              tone="default"
            />
            <InfoCard
              label="Renewal Date"
              value={formatDateDisplay(customer.renewalDate)}
              tone="default"
            />
            <InfoCard
              label="Days Remaining"
              value={daysRemaining === null ? "-" : String(daysRemaining)}
              tone={expiryTone}
            />
          </section>

          <section className="aj-portal-grid-two">
            <div className="aj-portal-glass aj-portal-section">
              <div className="aj-portal-section-inner">
                <p className="aj-portal-section-kicker">Account overview</p>
                <h2 className="aj-portal-section-title">Customer Information</h2>
                <p className="aj-portal-section-text">
                  Basic personal and connection information linked to your billing profile.
                </p>

                <div className="aj-portal-detail-list">
                  <DetailRow label="Customer Name" value={safeText(customer.customerName)} />
                  <DetailRow label="Mobile Number" value={safeText(customer.mobileNumber)} />
                  <DetailRow label="Address" value={safeText(customer.address)} />
                  <DetailRow label="ISP Name" value={safeText(customer.ispName)} />
                  <DetailRow label="Copy Number" value={safeText(customer.copyNumber)} />
                  <DetailRow label="Serial Number" value={safeText(customer.serialNumber)} />
                </div>
              </div>
            </div>

            <div className="aj-portal-glass aj-portal-section">
              <div className="aj-portal-section-inner">
                <p className="aj-portal-section-kicker">Billing summary</p>
                <h2 className="aj-portal-section-title">Plan & Payment Details</h2>
                <p className="aj-portal-section-text">
                  Check your current plan, renewal cycle, payment history, total billing figures,
                  and expiry timeline.
                </p>

                <div className="aj-portal-detail-list">
                  <DetailRow label="Plan Name" value={safeText(customer.planName)} />
                  <DetailRow label="Plan Amount" value={formatCurrency(customer.planAmount)} />
                  <DetailRow
                    label="Installation Date"
                    value={formatDateDisplay(customer.installationDate)}
                  />
                  <DetailRow
                    label="Renewal Date"
                    value={formatDateDisplay(customer.renewalDate)}
                  />
                  <DetailRow
                    label="Expiry Date"
                    value={formatDateDisplay(customer.expiryDate)}
                    accent={expiryTone}
                  />
                  <DetailRow
                    label="Days Remaining"
                    value={
                      daysRemaining === null
                        ? "-"
                        : daysRemaining < 0
                        ? `Expired ${Math.abs(daysRemaining)} day(s) ago`
                        : `${daysRemaining} day(s)`
                    }
                    accent={expiryTone}
                  />
                  <DetailRow
                    label="Payment Date"
                    value={formatDateDisplay(customer.paymentDate)}
                  />
                  <DetailRow
                    label="Total Due Amount"
                    value={formatCurrency(customer.totalDueAmount)}
                  />
                  <DetailRow
                    label="Total Paid Amount"
                    value={formatCurrency(customer.totalPaidAmount)}
                  />
                  <DetailRow
                    label="Current Due Amount"
value={formatCurrency(customer.totalDueAmount)}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}