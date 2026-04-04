// 📅 FORMAT DATE
export function formatDateDisplay(date?: string | Date) {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// 📅 CALCULATE EXPIRY DATE
export function calculateExpiryDate(startDate: string, days = 30) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ⏳ DAYS REMAINING
export function getDaysRemaining(expiryDate?: string) {
  if (!expiryDate) return 0;

  const today = new Date();
  const expiry = new Date(expiryDate);

  const diff = expiry.getTime() - today.getTime();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// 🚦 STATUS
export function getStatus(expiryDate?: string) {
  const days = getDaysRemaining(expiryDate);

  if (days <= 0) return "Expired";
  if (days <= 3) return "Expiring";
  return "Active";
}

// 🔥 SMART RENEW DATE (IMPORTANT FIX)
export function getNextRenewalDate({
  renewalDate,
  planValidity = 30,
}: {
  renewalDate?: string;
  planValidity?: number;
}) {
  const today = new Date();

  const current = renewalDate ? new Date(renewalDate) : today;

  // ✅ pick later date (fix for early renew)
  const baseDate = current > today ? current : today;

  baseDate.setDate(baseDate.getDate() + planValidity);

  return baseDate.toISOString().slice(0, 10);
}