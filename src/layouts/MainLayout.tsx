import { Outlet, Link, useLocation } from "react-router-dom";

export default function MainLayout() {
  const location = useLocation();

  const linkStyle = (path: string) => ({
    display: "block",
    padding: "10px",
    color: location.pathname === path ? "#ffd700" : "#ccc",
    textDecoration: "none",
    fontWeight: "bold",
  });

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: "220px",
          background: "#111",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#ffd700" }}>AJ Computers</h2>

        <nav>
          <Link to="/dashboard" style={linkStyle("/dashboard")}>
            Dashboard
          </Link>
          <Link to="/customers" style={linkStyle("/customers")}>
            Customers
          </Link>
          <Link to="/plans" style={linkStyle("/plans")}>
            Plans
          </Link>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: "#0f1117" }}>
        {/* TOP BAR */}
        <div
          style={{
            padding: "15px",
            borderBottom: "1px solid #222",
            background: "#111",
          }}
        >
          <h3 style={{ margin: 0, color: "#fff" }}>
            ISP Billing Panel
          </h3>
        </div>

        {/* PAGE */}
        <div style={{ padding: "20px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}