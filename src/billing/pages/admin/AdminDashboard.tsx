import { useEffect, useMemo, useState } from "react";
import {
  getDashboardStats,
  getCustomers,
  receivePayment,
} from "../../lib/billing-storage";

type CustomerRow = {
  id: string;
  customerName?: string;
  mobileNumber?: string;
  planName?: string;
  expiryDate?: string;
  currentDueAmount?: number | string;
};

type FilterValue = "all" | "active" | "due" | "expired";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [s, c] = await Promise.all([
      getDashboardStats(),
      getCustomers(),
    ]);
    setStats(s);
    setCustomers(c || []);
    setLoading(false);
  }

  function openPayment(c: CustomerRow) {
    setSelectedCustomer(c);
    setAmount("");
    setShowModal(true);
  }

  async function submitPayment() {
    if (!selectedCustomer || !amount) return;
    await receivePayment(selectedCustomer.id, Number(amount));
    setShowModal(false);
    load();
  }

  function getState(c: CustomerRow) {
    const isExpired = c.expiryDate
      ? new Date(c.expiryDate).getTime() < Date.now()
      : false;

    const isDue = Number(c.currentDueAmount || 0) > 0;

    if (isExpired) return "expired";
    if (isDue) return "due";
    return "active";
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return customers.filter((c) => {
      const text = `${c.customerName} ${c.mobileNumber} ${c.planName}`.toLowerCase();
      const state = getState(c);
      return (filter === "all" || state === filter) && text.includes(q);
    });
  }, [customers, search, filter]);

  if (loading || !stats) {
    return <div style={{ padding: 40, color: "white" }}>Loading...</div>;
  }

  return (
    <div style={styles.page}>
      {/* 🔥 STATS */}
      <div style={styles.stats}>
        <StatCard title="Total" value={stats.totalCustomers} />
        <StatCard title="Active" value={stats.activeCount} color="#22c55e" />
        <StatCard title="Expired" value={stats.expiredCount} color="#ef4444" />
        <StatCard title="Due" value={stats.dueCount} color="#f59e0b" />
        <StatCard title="Total Due ₹" value={stats.totalDueAmount} />

        <StatCard title="Today ₹" value={stats.amountToday} />
        <StatCard title="Yesterday ₹" value={stats.amountYesterday} />
        <StatCard title="Total ₹" value={stats.totalReceived} />
      </div>

      {/* 🔥 TABLE */}
      <div style={styles.panel}>
        <div style={styles.toolbar}>
          <input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={styles.select}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="due">Due</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Action</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Plan</th>
              <th>Expiry</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={styles.row}>
                <td>
                  <button style={styles.payBtn} onClick={() => openPayment(c)}>
                    Pay
                  </button>
                </td>

                <td>{c.customerName}</td>
                <td>{c.mobileNumber}</td>
                <td>{c.planName}</td>
                <td>{c.expiryDate}</td>
                <td style={{ fontWeight: 700 }}>₹{c.currentDueAmount}</td>

                <td>
                  {getState(c) === "active" && <span style={styles.green}>Active</span>}
                  {getState(c) === "due" && <span style={styles.orange}>Due</span>}
                  {getState(c) === "expired" && <span style={styles.red}>Expired</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔥 MODAL */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: 10 }}>💰 Receive Payment</h3>
            <p>{selectedCustomer?.customerName}</p>

            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button style={styles.payBtn} onClick={submitPayment}>
                Submit
              </button>
              <button style={styles.cancel} onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  return (
    <div style={{ ...styles.card, color: color || "#FFD700" }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

const styles: any = {
  page: {
    padding: 24,
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #111827, #020617)",
    color: "white",
  },

  stats: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 26,
  },

  card: {
    padding: 18,
    borderRadius: 20,
    minWidth: 150,
    background:
      "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))",
    border: "1px solid rgba(255,215,0,0.3)",
    boxShadow: "0 0 25px rgba(255,215,0,0.15)",
  },

  panel: {
    padding: 20,
    borderRadius: 18,
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  toolbar: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
  },

  input: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#020617",
    color: "white",
  },

  select: {
    padding: 10,
    borderRadius: 10,
    background: "#020617",
    color: "white",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  row: {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  payBtn: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    padding: "6px 12px",
    border: "none",
    borderRadius: 10,
    color: "white",
    cursor: "pointer",
  },

  cancel: {
    background: "#ef4444",
    padding: "6px 12px",
    borderRadius: 10,
    color: "white",
    border: "none",
  },

  green: {
    background: "#22c55e",
    padding: "4px 10px",
    borderRadius: 999,
  },

  orange: {
    background: "#f59e0b",
    padding: "4px 10px",
    borderRadius: 999,
  },

  red: {
    background: "#ef4444",
    padding: "4px 10px",
    borderRadius: 999,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    background: "#020617",
    padding: 20,
    borderRadius: 16,
    width: 320,
    border: "1px solid rgba(255,215,0,0.2)",
  },
};