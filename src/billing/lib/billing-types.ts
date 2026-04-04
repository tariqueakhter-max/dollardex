
export type BillingCustomerStatus = "active" | "expired" | "not_renewed";

export type BillingCustomer = {
  id: string;
  customerName: string;
  mobileNumber: string;
  address: string;
  ispName: string;

  planId: string;
  planName: string;
  planAmount: number;
  planValidity: number;

  installationDate?: string;
  renewalDate: string;
  expiryDate?: string;
  paymentDate: string;

  totalDueAmount: number;
  totalPaidAmount: number;
  currentDueAmount: number;

  status?: BillingCustomerStatus;

  copyNumber: string;
  serialNumber: string;
  portalPassword: string;

  createdAt: string;
  updatedAt: string;
};