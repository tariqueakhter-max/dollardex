import { useEffect, useState } from "react";
import type { BillingCustomer } from "../../lib/billing-types";
import { getCustomers } from "../../lib/billing-storage";
import CustomerTable from "../../components/CustomerTable";
import { supabase } from "../../lib/supabase";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<BillingCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ ADD DUE FUNCTION (FULL FIXED)
  const handleAddDue = async (
    customerId: string,
    currentDue: number
  ) => {
    const input = prompt("Enter due amount:");

    if (!input) return;

    const addAmount = Number(input);

    if (isNaN(addAmount) || addAmount <= 0) {
      alert("Invalid amount");
      return;
    }

    const newDue = Number(currentDue || 0) + addAmount;
const { error } = await supabase
  .from("billing_customers")
  .update({
    total_due_amount: newDue,
  })
  .eq("id", customerId)
  .select(); // ✅ VERY IMPORTANT



    if (error) {
      console.error(error);
      alert("Failed to update due");
      return;
    }

    alert("Due added successfully");

    loadCustomers(); // ✅ refresh data
  };

  return (
    <div className="billing-page">
      <div className="billing-page-header" style={{ marginBottom: 18 }}>
        <div>
          <h1
            className="billing-page-title"
            style={{
              marginBottom: 8,
              color: "#fff7fb",
              textShadow: "0 2px 14px rgba(217,70,239,0.28)",
            }}
          >
            View Customers
          </h1>

          <p
            className="billing-page-subtitle"
            style={{
              color: "rgba(255,255,255,0.78)",
              margin: 0,
            }}
          >
            Search by name, mobile, ISP or serial number.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.76)", padding: "16px 0" }}>
          Loading customers...
        </div>
      ) : (
        <CustomerTable
          customers={customers}
          onRefresh={loadCustomers}
          onAddDue={handleAddDue} // ✅ WORKING NOW
        />
      )}
    </div>
  );
}