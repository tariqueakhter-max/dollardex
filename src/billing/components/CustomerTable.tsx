import { getInvoices } from "../lib/invoiceService";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { BillingCustomer } from "../lib/billing-types";
import { getPlans, type BillingPlan } from "../lib/billing-plans";
import { renewCustomer, updateCustomer } from "../lib/billing-storage";
import { formatDateDisplay, calculateExpiryDate, getDaysRemaining, getStatus, } from "../lib/date-utils";
import { supabase } from "../lib/supabase";
import { createInvoice } from "../lib/invoiceService";

type Props = {
  customers: BillingCustomer[];
  onRefresh?: () => void | Promise<void>;
};

type FilterType = "ALL" | "EXPIRING" | "EXPIRED" | "DUE";
type ToastType = "success" | "error" | "info";

type ToastState = {
  message: string;
  type: ToastType;
} | null;

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeText(value: string | undefined | null) {
  return (value || "").trim().toLowerCase();
}

function parseSerial(value: unknown) {
  const text = String(value || "").trim();
  const num = parseInt(text, 10);
  return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
}

function formatDateForStorage(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(dateString?: string | null) {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length !== 3) return null;

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null;
  }

  return new Date(y, m - 1, d);
}

function getExistingExpiryDate(customer: BillingCustomer) {
  if (!customer.renewalDate) return null;
  const expiry = calculateExpiryDate(customer.renewalDate, customer.planValidity);
  return parseISODate(expiry);
}

function getNextRenewalDate(customer: BillingCustomer) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const existingExpiry = getExistingExpiryDate(customer);

  if (existingExpiry && existingExpiry >= todayOnly) {
    return formatDateForStorage(existingExpiry);
  }

  return formatDateForStorage(todayOnly);
}

function getNextExpiryDisplayForValues(customer: BillingCustomer, planValidity: number) {
  const nextRenewalDate = getNextRenewalDate(customer);
  const nextExpiry = calculateExpiryDate(nextRenewalDate, planValidity);
  return formatDateDisplay(nextExpiry);
}

const sectionCardStyle: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(30,41,59,0.62) 100%)",
  border: "1px solid rgba(244,114,182,0.14)",
  borderRadius: 26,
  padding: 18,
  boxShadow: "0 16px 34px rgba(0,0,0,0.20)",
  backdropFilter: "blur(10px)",
};

const stickyToolsStyle: React.CSSProperties = {
  position: "sticky",
  top: 10,
  zIndex: 30,
  background:
    "linear-gradient(180deg, rgba(10,14,35,0.96) 0%, rgba(23,29,56,0.92) 100%)",
  border: "1px solid rgba(244,114,182,0.12)",
  borderRadius: 22,
  padding: 16,
  marginBottom: 18,
  boxShadow: "0 12px 26px rgba(0,0,0,0.22)",
  backdropFilter: "blur(14px)",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(2, 6, 23, 0.46)",
  border: "1px solid rgba(244,114,182,0.18)",
  color: "#fff",
  borderRadius: 18,
  padding: "14px 16px",
  outline: "none",
};

const pillBase: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#f8fafc",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(0,0,0,0.14)",
};

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: "linear-gradient(135deg, #d946ef 0%, #ec4899 55%, #f472b6 100%)",
  border: "1px solid rgba(244,114,182,0.55)",
  color: "#ffffff",
  boxShadow: "0 10px 24px rgba(217,70,239,0.30)",
};

const pageSizeSelectStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.96)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
  outline: "none",
  minWidth: 88,
  appearance: "auto",
  WebkitAppearance: "menulist",
  MozAppearance: "menulist",
};

const actionDetails: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const actionEdit: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid rgba(236,72,153,0.24)",
  background: "rgba(253,242,248,0.96)",
  color: "#be185d",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const actionPay: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #d946ef 0%, #ec4899 55%, #f472b6 100%)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(217,70,239,0.22)",
  whiteSpace: "nowrap",
};

const actionRenew: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid rgba(16,185,129,0.20)",
  background: "rgba(236,253,245,0.98)",
  color: "#059669",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const detailCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 12,
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(255,255,255,0.65)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const detailValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#fff",
  wordBreak: "break-word",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2, 6, 23, 0.70)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 200,
  backdropFilter: "blur(8px)",
};

const modalCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 620,
  borderRadius: 28,
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(15,23,42,0.98) 100%)",
  border: "1px solid rgba(244,114,182,0.16)",
  boxShadow: "0 28px 70px rgba(0,0,0,0.42)",
};

const modalHeaderStyle: React.CSSProperties = {
  padding: "18px 20px",
  background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 55%, #06b6d4 100%)",
  color: "#fff",
};

const modalBodyStyle: React.CSSProperties = {
  padding: 20,
  display: "grid",
  gap: 16,
};

const modalLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 800,
  color: "rgba(255,255,255,0.82)",
  marginBottom: 8,
  letterSpacing: 0.2,
};

const modalInputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(244,114,182,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  padding: "14px 16px",
  fontSize: 15,
  fontWeight: 700,
  outline: "none",
};

const modalSelectStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(244,114,182,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  padding: "14px 16px",
  fontSize: 15,
  fontWeight: 700,
  outline: "none",
  appearance: "auto",
  WebkitAppearance: "menulist",
  MozAppearance: "menulist",
};

const modalSummaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const modalSummaryCardStyle: React.CSSProperties = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 14,
};

const modalSummaryLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(255,255,255,0.64)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const modalSummaryValueStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#fff",
};

const modalHintStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: 12,
  fontWeight: 700,
};

const modalActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const modalCancelBtnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 120,
  borderRadius: 18,
  padding: "13px 16px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const modalConfirmBtnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 160,
  borderRadius: 18,
  padding: "13px 16px",
  border: "none",
  background: "linear-gradient(135deg, #d946ef 0%, #ec4899 55%, #22c55e 100%)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 26px rgba(217,70,239,0.24)",
};

const toastBaseStyle: React.CSSProperties = {
  position: "fixed",
  right: 18,
  bottom: 18,
  zIndex: 300,
  minWidth: 260,
  maxWidth: 420,
  padding: "14px 16px",
  borderRadius: 18,
  color: "#fff",
  fontWeight: 800,
  boxShadow: "0 18px 36px rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(10px)",
};

function InlineToast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  let bg =
    "linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(6,182,212,0.95) 100%)";

  if (toast.type === "success") {
    bg =
      "linear-gradient(135deg, rgba(16,185,129,0.96) 0%, rgba(5,150,105,0.96) 100%)";
  }

  if (toast.type === "error") {
    bg =
      "linear-gradient(135deg, rgba(239,68,68,0.96) 0%, rgba(190,24,93,0.96) 100%)";
  }

  return <div style={{ ...toastBaseStyle, background: bg }}>{toast.message}</div>;
}

export default function CustomerTable({ customers, onRefresh, onAddDue }: Props & { onAddDue: any }) {
  
const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState<ToastState>(null);

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const [payCustomer, setPayCustomer] = useState<BillingCustomer | null>(null);
  const [payAmount, setPayAmount] = useState("");
const [dueCustomer, setDueCustomer] = useState<BillingCustomer | null>(null);
const [dueAmount, setDueAmount] = useState("");

  const [renewCustomerData, setRenewCustomerData] = useState<BillingCustomer | null>(null);
  const [renewSelectedPlanId, setRenewSelectedPlanId] = useState("");
  const [renewReceivedAmount, setRenewReceivedAmount] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    async function loadPlansData() {
      try {
        setPlansLoading(true);
        const data = await getPlans();
        setPlans(data || []);
      } catch (error) {
        console.error("Failed to load plans:", error);
      } finally {
        setPlansLoading(false);
      }
    }

    loadPlansData();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const hasRenewal = !!c.renewalDate;
const due = toNumber(c.totalDueAmount, 0);
        if (!hasRenewal) {
          if (filter === "EXPIRED" || filter === "EXPIRING") return false;
        }
const status = hasRenewal
  ? getStatus(c.renewalDate)
  : "not_renewed";
const days = hasRenewal
  ? getDaysRemaining(c.renewalDate)
  : null;

if (filter === "EXPIRED") return status === "expired";

if (filter === "EXPIRING") {
  return status !== "expired" && days !== null && days >= 0 && days <= 7;
}
        
        if (filter === "DUE") return due > 0;
        return true;
      })
      .filter((c) => {
        if (!query.trim()) return true;
        const q = normalizeText(query);

        return (
          normalizeText(c.customerName).includes(q) ||
          normalizeText(c.mobileNumber).includes(q) ||
          normalizeText(c.ispName).includes(q) ||
          normalizeText(c.serialNumber).includes(q) ||
          normalizeText(c.planName).includes(q)
        );
      })
      .sort((a, b) => {
        const serialDiff = parseSerial(a.serialNumber) - parseSerial(b.serialNumber);
        if (serialDiff !== 0) return serialDiff;
        return (a.customerName || "").localeCompare(b.customerName || "");
      });
  }, [customers, filter, query]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCustomers = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, safeCurrentPage, pageSize]);

  const selectedRenewPlan = useMemo(() => {
    if (!renewCustomerData) return null;

    const byId = plans.find((p) => p.id === renewSelectedPlanId);
    if (byId) return byId;

    if (renewCustomerData.planId) {
      const byCustomerPlanId = plans.find((p) => p.id === renewCustomerData.planId);
      if (byCustomerPlanId) return byCustomerPlanId;
    }

    return {
      id: renewCustomerData.planId || "",
      name: renewCustomerData.planName || "Current Plan",
      speed: "",
      price: toNumber(renewCustomerData.planAmount, 0),
      validity_days: toNumber(renewCustomerData.planValidity, 30),
      description: "",
    } satisfies BillingPlan;
  }, [plans, renewCustomerData, renewSelectedPlanId]);

function openDueModal(customer: BillingCustomer) {
  setDueCustomer(customer);
  setDueAmount("");
}

function closeDueModal() {
  if (loadingId) return;
  setDueCustomer(null);
  setDueAmount("");
}

  function changeFilter(next: FilterType) {
    setFilter(next);
    setCurrentPage(1);
    setExpandedId(null);
  }

  function changeQuery(next: string) {
    setQuery(next);
    setCurrentPage(1);
    setExpandedId(null);
  }

  function changePageSize(next: number) {
    setPageSize(next);
    setCurrentPage(1);
    setExpandedId(null);
  }

  function showToast(message: string, type: ToastType = "info") {
    setToast({ message, type });
  }

  function toggleDetails(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function openPayModal(customer: BillingCustomer) {
    setPayCustomer(customer);
setPayAmount(String(toNumber(customer.totalDueAmount, 0) || ""));
  }

  function closePayModal() {
    if (loadingId) return;
    setPayCustomer(null);
    setPayAmount("");
  }

  function openRenewModal(customer: BillingCustomer) {
    const currentPlan =
      plans.find((p) => p.id === customer.planId) ||
      plans.find((p) => p.name === customer.planName);

    const selectedPlan = currentPlan || null;
    const planAmount = selectedPlan
      ? toNumber(selectedPlan.price, 0)
      : toNumber(customer.planAmount, 0);

    setRenewCustomerData(customer);
    setRenewSelectedPlanId(selectedPlan?.id || customer.planId || "");
    setRenewReceivedAmount(String(planAmount || ""));
  }

  function closeRenewModal() {
    if (loadingId) return;
    setRenewCustomerData(null);
    setRenewSelectedPlanId("");
    setRenewReceivedAmount("");
  }
async function handleConfirmAddDue() {
  if (!dueCustomer) return;

  const amount = Number(dueAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Enter valid amount", "error");
    return;
  }

  try {
if (!dueCustomer.id) return;
if (!payCustomer || !payCustomer.id) return;
if (!payCustomer || !payCustomer.id) return;
    // ✅ GET LATEST FROM DB
    const { data } = await supabase
      .from("billing_customers")
      .select("total_due_amount")
      .eq("id", dueCustomer.id)
      .single();

    const currentTotalDue = toNumber(data?.total_due_amount, 0);
    const newTotalDue = currentTotalDue + amount;

    await supabase
      .from("billing_customers")
      .update({
        total_due_amount: newTotalDue,
      })
      .eq("id", dueCustomer.id);

    closeDueModal();
    showToast("Due added successfully", "success");
    await onRefresh?.();
  } catch (error) {
    console.error(error);
    showToast("Failed to add due", "error");
  } finally {
    setLoadingId(null);
  }
}

async function handleConfirmPay() {
  if (!payCustomer) return;

  const paymentAmount = Number(payAmount || 0);

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    showToast("Please enter a valid payment amount.", "error");
    return;
  }

  try {
if (!payCustomer || !payCustomer.id) return;
if (!payCustomer || !payCustomer.id) return;
    // ✅ GET LATEST FROM DB
    const { data } = await supabase
      .from("billing_customers")
      .select("total_due_amount")
      .eq("id", payCustomer.id)
      .single();

    const currentDue = toNumber(data?.total_due_amount, 0);
    const newDue = Math.max(0, currentDue - paymentAmount);

    await supabase
      .from("billing_customers")
      .update({
        total_due_amount: newDue,
      })
      .eq("id", payCustomer.id);

    closePayModal();
    showToast("Payment received successfully.", "success");
    await onRefresh?.();
  } catch (error) {
    console.error(error);
    showToast("Failed to receive payment.", "error");
  } finally {
    setLoadingId(null);
  }
}



  async function handleConfirmRenew() {
    if (!renewCustomerData) return;
    if (!selectedRenewPlan) {
      showToast("Please select a plan.", "error");
      return;
    }

    const receivedAmount = Number(renewReceivedAmount || 0);
    const selectedPlanAmount = toNumber(selectedRenewPlan.price, 0);
    const selectedPlanValidity = toNumber(selectedRenewPlan.validity_days, 30);

    if (selectedPlanAmount <= 0) {
      showToast("Selected plan amount must be greater than 0.", "error");
      return;
    }

    if (!Number.isFinite(receivedAmount) || receivedAmount < 0) {
      showToast("Received amount cannot be negative.", "error");
      return;
    }

    try {
if (!payCustomer || !payCustomer.id) return;
if (!payCustomer || !payCustomer.id) return;
      let customerForRenew = renewCustomerData;

      const planChanged =
        (renewCustomerData.planId || "") !== (selectedRenewPlan.id || "") ||
        toNumber(renewCustomerData.planAmount, 0) !== selectedPlanAmount ||
        toNumber(renewCustomerData.planValidity, 30) !== selectedPlanValidity ||
        (renewCustomerData.planName || "") !== (selectedRenewPlan.name || "");

      if (planChanged) {
        customerForRenew = await updateCustomer({
        id: renewCustomerData.id,
          ...renewCustomerData,
          planId: selectedRenewPlan.id,
          planName: selectedRenewPlan.name,
          planAmount: selectedPlanAmount,
          planValidity: selectedPlanValidity,
        });
      }

      if (!customerForRenew.id) return;
      await renewCustomer(customerForRenew.id, {
      renewalDate: getNextRenewalDate(customerForRenew),
      receivedAmount,
      paymentDate: receivedAmount > 0 ? formatDateForStorage(new Date()) : undefined,
      });

// ✅ CREATE INVOICE AFTER RENEW
const { data } = await supabase
  .from("billing_customers")
  .select("total_due_amount")
  .eq("id", renewCustomerData.id)
  .single();

const newTotalDue = toNumber(data?.total_due_amount, 0);
await createInvoice({
customer_id: renewCustomerData.id || "",
  plan_id: selectedRenewPlan.id,
  amount: selectedPlanAmount,
due_before: newTotalDue - selectedPlanAmount,
due_after: newTotalDue,});

      closeRenewModal();
      showToast("Renewal completed successfully.", "success");
      await onRefresh?.();
    } catch (error) {
      console.error("Failed to renew customer:", error);
      showToast("Failed to renew customer.", "error");
    } finally {
      setLoadingId(null);
    }
  }

const payPreview = useMemo(() => {
  if (!payCustomer) {
    return {
      currentDue: 0,
      newCurrentDue: 0,
    };
  }

  const currentDue = toNumber(payCustomer.totalDueAmount, 0);
  const paymentAmount = toNumber(payAmount, 0);

  return {
    currentDue,
    newCurrentDue: Math.max(0, currentDue - Math.max(0, paymentAmount)),
  };
}, [payCustomer, payAmount]);



  const renewPreview = useMemo(() => {
    if (!renewCustomerData || !selectedRenewPlan) {
      return {
        selectedPlanName: "-",
        selectedPlanAmount: 0,
        selectedPlanValidity: 0,
        receivedNow: 0,
        newTotalDue: 0,
        nextExpiryDisplay: "-",
      };
    }

    const planAmount = toNumber(selectedRenewPlan.price, 0);
    const planValidity = toNumber(selectedRenewPlan.validity_days, 30);
    const oldTotalDue = toNumber(renewCustomerData.totalDueAmount, 0);
    const receivedNow = Math.max(0, toNumber(renewReceivedAmount, 0));

    return {
      selectedPlanName: selectedRenewPlan.name || "-",
      selectedPlanAmount: planAmount,
      selectedPlanValidity: planValidity,
      receivedNow,
      newTotalDue: oldTotalDue + planAmount,
      nextExpiryDisplay: getNextExpiryDisplayForValues(renewCustomerData, planValidity),
    };
  }, [renewCustomerData, renewReceivedAmount, selectedRenewPlan]);

  return (
    <>
      <div style={sectionCardStyle}>
        <style>
          {`
            .aj-customer-table-wrap {
              overflow-x: auto;
              border-radius: 18px;
              border: 1px solid rgba(244,114,182,0.12);
              max-height: 70vh;
            }

            .aj-customer-table {
              width: 100%;
              border-collapse: collapse;
              min-width: 1120px;
              background: rgba(2, 6, 23, 0.24);
            }

            .aj-customer-table thead th {
              position: sticky;
              top: 0;
              z-index: 15;
              background: rgba(15, 23, 42, 0.96);
              backdrop-filter: blur(10px);
              box-shadow: inset 0 -1px 0 rgba(244,114,182,0.10);
            }

            .aj-page-size-select option,
            .aj-renew-plan-select option {
              background: #0f172a;
              color: #ffffff;
            }

            @media (max-width: 700px) {
              .aj-renew-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}
        </style>

        <div style={stickyToolsStyle}>
          <div style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="Search by name, mobile number, ISP, serial number"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              className="billing-input"
              style={searchInputStyle}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                style={filter === "ALL" ? pillActive : pillBase}
                onClick={() => changeFilter("ALL")}
              >
                All
              </button>
              <button
                type="button"
                style={filter === "EXPIRING" ? pillActive : pillBase}
                onClick={() => changeFilter("EXPIRING")}
              >
                Expiring
              </button>
              <button
                type="button"
                style={filter === "EXPIRED" ? pillActive : pillBase}
                onClick={() => changeFilter("EXPIRED")}
              >
                Expired
              </button>
              <button
                type="button"
                style={filter === "DUE" ? pillActive : pillBase}
                onClick={() => changeFilter("DUE")}
              >
                Due
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700 }}>
                Show
              </span>
              <select
                className="aj-page-size-select"
                value={pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                style={pageSizeSelectStyle}
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={300}>300</option>
                <option value={400}>400</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
        </div>

        <div className="aj-customer-table-wrap">
          <table className="aj-customer-table">
            <thead>
              <tr>
                <th style={thStyle}>Serial</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Mobile</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Due</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 20,
                      textAlign: "center",
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => {
                  const hasRenewal = !!c.renewalDate;
                  const status = hasRenewal
                    ? getStatus(c.renewalDate)
                    : "not_renewed";
                  const days = hasRenewal
                    ? getDaysRemaining(c.renewalDate)
                    : null;
const due = toNumber(c.totalDueAmount, 0);
                  const expiryDate = hasRenewal
                    ? calculateExpiryDate(c.renewalDate, c.planValidity)
                    : "";

                  let rowBg = "rgba(2, 6, 23, 0.10)";
                  if (!hasRenewal) rowBg = "rgba(148, 163, 184, 0.08)";
                  else if (status === "expired") rowBg = "rgba(239, 68, 68, 0.12)";
                  else if (due > 0) rowBg = "rgba(217, 70, 239, 0.10)";
                  else if (days !== null && days >= 0 && days <= 7) {
                    rowBg = "rgba(244, 114, 182, 0.10)";
                  }

                  return (
                    <Fragment key={c.id}>
                      <tr
                        style={{
                          background: rowBg,
                          borderTop: "1px solid rgba(244,114,182,0.10)",
                        }}
                      >
                        <td style={tdStyle}>{c.serialNumber || "-"}</td>
                        <td style={tdStyle}>{c.customerName}</td>
                        <td style={tdStyle}>{c.mobileNumber}</td>
                        <td style={tdStyle}>{c.planName}</td>
                        <td style={tdStyle}>
                          {!hasRenewal
                            ? "⚪ Not Renewed"
                            : status === "expired"
                            ? "🔴 Expired"
                            : days !== null && days <= 3
                            ? "🟡 Expiring Soon"
                            : "🟢 Active"}
                        </td>
                        <td style={tdStyle}>₹{due}</td>
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "nowrap",
                              alignItems: "center",
                              minWidth: "max-content",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                              if (!c.id) return;
                              toggleDetails(c.id);
                              }}
                              style={actionDetails}
                            >
                              {expandedId === c.id ? "Hide Details" : "Details"}
                            </button>

                            <Link
                              to={`/admin/customers/${c.id}/edit`}
                              style={actionEdit}
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() => openPayModal(c)}
                              disabled={loadingId === c.id}
                              style={{
                                ...actionPay,
                                opacity: loadingId === c.id ? 0.7 : 1,
                              }}
                            >
                              Receive Payment
                            </button>
<button
  type="button"
  onClick={() => openDueModal(c)}
  style={{
    padding: "8px 14px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }}
>
  + Due
</button>

<button
  type="button"
  onClick={() => openRenewModal(c)}
  disabled={loadingId === c.id}
  style={{
    ...actionRenew,
    opacity: loadingId === c.id ? 0.7 : 1,
  }}
>
  Renew
</button>
<button
  type="button"
  onClick={async () => {
    if (!c.id) return;
    const invoices = await getInvoices(c.id);
    console.log("Invoices:", invoices);
    alert(`Invoices loaded: ${invoices.length}`);
  }}
  style={{
    padding: "8px 14px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }}
>
  Bills
</button>


                          </div>
                        </td>
                      </tr>

                      {expandedId === c.id && (
                        <tr
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            borderTop: "1px solid rgba(244,114,182,0.08)",
                          }}
                        >
                          <td colSpan={7} style={{ padding: 16 }}>
                            <div style={detailGridStyle}>
                              <div style={detailCardStyle}>
                                <div style={detailLabelStyle}>Installation Date</div>
                                <div style={detailValueStyle}>
                                  {formatDateDisplay(c.installationDate)}
                                </div>
                              </div>

                              <div style={detailCardStyle}>
                                <div style={detailLabelStyle}>Renewal Date</div>
                                <div style={detailValueStyle}>
                                  {formatDateDisplay(c.renewalDate)}
                                </div>
                              </div>

                              <div style={detailCardStyle}>
                                <div style={detailLabelStyle}>Expiry Date</div>
                                <div style={detailValueStyle}>
                                  {formatDateDisplay(expiryDate)}
                                </div>
                              </div>

                              <div style={detailCardStyle}>
                                <div style={detailLabelStyle}>Payment Date</div>
                                <div style={detailValueStyle}>
                                  {formatDateDisplay(c.paymentDate)}
                                </div>
                              </div>

                              <div style={detailCardStyle}>
                                <div style={detailLabelStyle}>Days</div>
                                <div style={detailValueStyle}>
                                  {!hasRenewal
                                    ? "-"
                                    : status === "expired"
                                    ? `${Math.abs(days || 0)} days ago`
                                    : `${days} days remaining`}
                                </div>
                              </div>

                              <div style={detailCardStyle}>
                                <div style={detailLabelStyle}>Address</div>
                                <div style={detailValueStyle}>{c.address || "-"}</div>
                              </div>

                              <div style={detailCardStyle}>
                                <div style={detailLabelStyle}>ISP</div>
                                <div style={detailValueStyle}>{c.ispName || "-"}</div>
                              </div>

                              <div style={detailCardStyle}>
  <div style={detailLabelStyle}>Serial Number</div>
  <div style={detailValueStyle}>{c.serialNumber || "-"}</div>
</div>

                              <div style={detailCardStyle}>
                                <div style={detailLabelStyle}>Plan Amount</div>
                                <div style={detailValueStyle}>₹{toNumber(c.planAmount, 0)}</div>
                              </div>
<div style={detailCardStyle}>
  <div style={detailLabelStyle}>Total Due Amount</div>
  <div style={detailValueStyle}>
    ₹{toNumber(c.totalDueAmount, 0)}
  </div>
</div>

</div>  {/* ✅ ADD THIS — closes grid */}

</td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, fontWeight: 700 }}>
            Showing{" "}
            {filteredCustomers.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
            {" - "}
            {Math.min(safeCurrentPage * pageSize, filteredCustomers.length)}
            {" of "}
            {filteredCustomers.length}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              style={{
                ...pillBase,
                opacity: safeCurrentPage <= 1 ? 0.45 : 1,
                cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>

            <div
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                padding: "0 4px",
              }}
            >
              Page {safeCurrentPage} / {totalPages}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              style={{
                ...pillActive,
                opacity: safeCurrentPage >= totalPages ? 0.45 : 1,
                cursor: safeCurrentPage >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
{/* ================= MODALS ================= */}

{/* PAY MODAL */}
{payCustomer && (
  <div style={modalOverlayStyle} onClick={closePayModal}>
    <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>

      <div style={modalHeaderStyle}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>
          Receive Payment
        </div>
        <div style={{ marginTop: 6, fontWeight: 700 }}>
          {payCustomer.customerName} • {payCustomer.mobileNumber}
        </div>
      </div>

      <div style={modalBodyStyle}>
        <div style={modalSummaryCardStyle}>
          <div style={modalSummaryLabelStyle}>Plan</div>
          <div style={modalSummaryValueStyle}>
            {payCustomer.planName || "-"}
          </div>
        </div>

        <div>
          <label style={modalLabelStyle}>Payment Amount</label>
          <input
            type="text"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            style={modalInputStyle}
            placeholder="Enter payment amount"
          />
        </div>

        <div style={modalSummaryGridStyle}>
        <div style={modalSummaryCardStyle}>
            <div style={modalSummaryLabelStyle}>Remaining Due</div>
            <div style={modalSummaryValueStyle}>
              ₹{payPreview.newCurrentDue}
            </div>
          </div>
        </div>

        <div style={modalActionsStyle}>
          <button onClick={closePayModal} style={modalCancelBtnStyle}>
            Cancel
          </button>

          <button onClick={handleConfirmPay} style={modalConfirmBtnStyle}>
            Confirm Payment
          </button>
        </div>
      </div>

    </div>
  </div>
)}

{/* DUE MODAL */}
{dueCustomer && (
  <div style={modalOverlayStyle} onClick={closeDueModal}>
    <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>

      <div style={modalHeaderStyle}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>
          Add Due Amount
        </div>
        <div style={{ marginTop: 6, fontWeight: 700 }}>
          {dueCustomer.customerName} • {dueCustomer.mobileNumber}
        </div>
      </div>

      <div style={modalBodyStyle}>
        <div>
          <label style={modalLabelStyle}>Enter Amount</label>
          <input
            type="text"
            value={dueAmount}
            onChange={(e) => setDueAmount(e.target.value)}
            style={modalInputStyle}
            placeholder="Enter due amount"
          />
        </div>

        <div style={modalActionsStyle}>
          <button onClick={closeDueModal} style={modalCancelBtnStyle}>
            Cancel
          </button>
          <button onClick={handleConfirmAddDue} style={modalConfirmBtnStyle}>
            Add Due
          </button>
        </div>
      </div>

    </div>
  </div>
)}

{/* RENEW MODAL */}
{renewCustomerData && (
  <div style={modalOverlayStyle} onClick={closeRenewModal}>
    <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
      <div style={modalHeaderStyle}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Renew Customer</div>
        <div style={{ marginTop: 6, fontWeight: 700 }}>
          {renewCustomerData.customerName} • {renewCustomerData.mobileNumber}
        </div>
      </div>

      <div style={modalBodyStyle}>
        <div className="aj-renew-grid" style={modalSummaryGridStyle}>
          <div style={modalSummaryCardStyle}>
            <div style={modalSummaryLabelStyle}>Current Plan</div>
            <div style={modalSummaryValueStyle}>
              {renewCustomerData.planName || "-"}
            </div>
          </div>

          <div style={modalSummaryCardStyle}>
            <div style={modalSummaryLabelStyle}>Current Plan Amount</div>
            <div style={modalSummaryValueStyle}>
              ₹{toNumber(renewCustomerData.planAmount, 0)}
            </div>
          </div>
        </div>

        <div>
          <label style={modalLabelStyle}>Renew With Plan</label>
          <select
            value={renewSelectedPlanId}
            onChange={(e) => {
              const nextPlanId = e.target.value;
              setRenewSelectedPlanId(nextPlanId);
              const nextPlan = plans.find((p) => p.id === nextPlanId);
              if (nextPlan) {
                setRenewReceivedAmount(String(toNumber(nextPlan.price, 0)));
              }
            }}
            style={modalSelectStyle}
          >
            <option value="">Select plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - ₹{toNumber(plan.price)} - {toNumber(plan.validity_days)} days
              </option>
            ))}
          </select>
        </div>

        <div style={modalSummaryGridStyle}>
          <div style={modalSummaryCardStyle}>
            <div style={modalSummaryLabelStyle}>Selected Plan</div>
            <div style={modalSummaryValueStyle}>
              {renewPreview.selectedPlanName}
            </div>
          </div>

          <div style={modalSummaryCardStyle}>
            <div style={modalSummaryLabelStyle}>Plan Amount</div>
            <div style={modalSummaryValueStyle}>
              ₹{renewPreview.selectedPlanAmount}
            </div>
          </div>

          <div style={modalSummaryCardStyle}>
            <div style={modalSummaryLabelStyle}>Validity</div>
            <div style={modalSummaryValueStyle}>
              {renewPreview.selectedPlanValidity} days
            </div>
          </div>

          <div style={modalSummaryCardStyle}>
            <div style={modalSummaryLabelStyle}>New Expiry</div>
            <div style={modalSummaryValueStyle}>
              {renewPreview.nextExpiryDisplay}
            </div>
          </div>
        </div>

        <div>
          <label style={modalLabelStyle}>Received Amount</label>
          <input
            type="text"
            value={renewReceivedAmount}
            onChange={(e) => setRenewReceivedAmount(e.target.value)}
            style={modalInputStyle}
          />
        </div>

        <div style={modalSummaryGridStyle}>
          <div style={modalSummaryCardStyle}>
            <div style={modalSummaryLabelStyle}>New Total Due</div>
            <div style={modalSummaryValueStyle}>
              ₹{renewPreview.newTotalDue}
            </div>
          </div>
          </div>
        <div style={modalActionsStyle}>
          <button onClick={closeRenewModal} style={modalCancelBtnStyle}>
            Cancel
          </button>

          <button onClick={handleConfirmRenew} style={modalConfirmBtnStyle}>
            Confirm Renew
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      <InlineToast toast={toast} />
    </>
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