export const DB = {
  customers: {
    table: "billing_customers",
    id: "id",
  },
  payments: {
    table: "billing_payments",
    customerId: "customer_id",
  },
};