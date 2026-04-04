
import type { ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

type NavBtnProps = {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
};

const navBase: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#f8fafc",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(0,0,0,0.14)",
};

const navActive: React.CSSProperties = {
  ...navBase,
  background: "linear-gradient(135deg, #d946ef 0%, #ec4899 55%, #f472b6 100%)",
  border: "1px solid rgba(244,114,182,0.55)",
  color: "#ffffff",
  boxShadow: "0 10px 24px rgba(217,70,239,0.30)",
};

const logoutBtn: React.CSSProperties = {
  ...navBase,
  background: "linear-gradient(135deg, rgba(190,24,93,0.94) 0%, rgba(225,29,72,0.94) 100%)",
  border: "1px solid rgba(244,63,94,0.36)",
  color: "#fff",
};

function NavBtn({ children, active, onClick }: NavBtnProps) {
  return (
    <button onClick={onClick} style={active ? navActive : navBase}>
      {children}
    </button>
  );
}

export default function BillingLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;

  const isAdminRoute = path.startsWith("/ajcomputers_billing/admin");
  const isPortalRoute = path.startsWith("/ajcomputers_billing/portal");

  const showAdminNav =
    isAdminRoute && path !== "/ajcomputers_billing/admin";

  const showPortalNav =
    isPortalRoute && path !== "/ajcomputers_billing/portal/login";

  function logoutAdmin() {
    localStorage.removeItem("billing_admin_session");
    navigate("/ajcomputers_billing/admin");
  }

  function logoutPortal() {
    localStorage.removeItem("billing_customer_session");
    navigate("/ajcomputers_billing/portal/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(244,114,182,0.18) 0%, rgba(2,6,23,0) 26%), linear-gradient(90deg, #020617 0%, #020617 40%, #03193f 100%)",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(2,6,23,0.72)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "18px 18px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 0.3,
                background:
                  "linear-gradient(90deg, #facc15 0%, #a3e635 35%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AJCOMPUTERS BILLING
            </div>
            <div
              style={{
                marginTop: 4,
                color: "rgba(255,255,255,0.70)",
                fontSize: 14,
              }}
            >
              Broadband • IPTV • OTT • IP Telephony
            </div>
          </div>

          {!showAdminNav && !showPortalNav && (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <NavBtn
                active={path === "/ajcomputers_billing"}
                onClick={() => navigate("/ajcomputers_billing")}
              >
                Home
              </NavBtn>

              <NavBtn
                active={path === "/ajcomputers_billing/admin"}
                onClick={() => navigate("/ajcomputers_billing/admin")}
              >
                Admin Login
              </NavBtn>

              <NavBtn
                active={path === "/ajcomputers_billing/portal/login"}
                onClick={() => navigate("/ajcomputers_billing/portal/login")}
              >
                Customer Login
              </NavBtn>
            </div>
          )}
        </div>
      </header>

      {showAdminNav && (
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(15,23,42,0.58)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "12px 18px",
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <NavBtn
              active={path === "/ajcomputers_billing/admin/dashboard"}
              onClick={() => navigate("/ajcomputers_billing/admin/dashboard")}
            >
              Dashboard
            </NavBtn>

            <NavBtn
              active={
                path === "/ajcomputers_billing/admin/customers" ||
                path.includes("/ajcomputers_billing/admin/customers/")
              }
              onClick={() => navigate("/ajcomputers_billing/admin/customers")}
            >
              Customers
            </NavBtn>

            <NavBtn
              active={path === "/ajcomputers_billing/admin/customers/new"}
              onClick={() => navigate("/ajcomputers_billing/admin/customers/new")}
            >
              Add Customer
            </NavBtn>

            <NavBtn
              active={path === "/ajcomputers_billing/admin/plans"}
              onClick={() => navigate("/ajcomputers_billing/admin/plans")}
            >
              Plans
            </NavBtn>

            <NavBtn
              active={path === "/ajcomputers_billing/admin/reminders"}
              onClick={() => navigate("/ajcomputers_billing/admin/reminders")}
            >
              Reminders
            </NavBtn>

            <NavBtn
              active={path === "/ajcomputers_billing/admin/change-password"}
              onClick={() => navigate("/ajcomputers_billing/admin/change-password")}
            >
              Change Password
            </NavBtn>

            <button
              onClick={logoutAdmin}
              style={{
                ...logoutBtn,
                marginLeft: "auto",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {showPortalNav && (
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(15,23,42,0.58)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "12px 18px",
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <NavBtn
              active={path === "/ajcomputers_billing/portal/dashboard"}
              onClick={() => navigate("/ajcomputers_billing/portal/dashboard")}
            >
              Dashboard
            </NavBtn>

            <NavBtn
              active={path === "/ajcomputers_billing/portal/change-password"}
              onClick={() => navigate("/ajcomputers_billing/portal/change-password")}
            >
              Change Password
            </NavBtn>

            <button
              onClick={logoutPortal}
              style={{
                ...logoutBtn,
                marginLeft: "auto",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <main
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "24px 18px 30px",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}