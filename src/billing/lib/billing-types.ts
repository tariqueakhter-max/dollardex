export type BillingCustomerStatus =
  | "active"
  | "expiring"
  | "expired"
  | "not_renewed";

export interface BillingCustomer {
  id?: string;
  customerId?: string;

  customerName: string;
  mobileNumber: string;
  address: string;

  ispName: string;

  planId: string | null;
  planName: string;
  planAmount: number;
  planValidity: number;

  installationDate: string;
  renewalDate: string;

  // ✅ STATUS
  status?: BillingCustomerStatus;

  // ✅ BILLING FIELDS (CRITICAL FIX)
  paymentDate?: string;
  totalDueAmount?: number;
  totalPaidAmount?: number;
  currentDueAmount?: number;

  // ✅ EXTRA META
  copyNumber?: string;
  serialNumber?: string;

  // ✅ DERIVED / OPTIONAL
  expiryDate?: string;

  // ✅ AUTH
  portalPassword: string;

  email?: string;
  notes?: string;

  createdAt?: string;
  updatedAt?: string;
}