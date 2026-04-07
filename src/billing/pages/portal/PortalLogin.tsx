
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginPortal } from "../../lib/billing-auth";
import { authenticateCustomer } from "../../lib/billing-storage";

export default function PortalLogin() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const navigate = useNavigate();

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

async function handleLogin(e: React.FormEvent) {
  e.preventDefault();

  if (!loginId.trim()) {
    showToast("error", "Enter Customer ID or Mobile Number");
    return;
  }

  if (!password.trim()) {
    showToast("error", "Enter password");
    return;
  }

  setLoading(true);

  try {
    const customer = await authenticateCustomer(loginId, password);

    if (!customer) {
      showToast("error", "Invalid ID / Mobile / Password");
      return;
    }

    if (!customer.id) {
      showToast("error", "Invalid customer record");
      return;
    }

    loginPortal(customer.id);

    showToast("success", "Login successful");

    setTimeout(() => {
navigate("/customers/dashboard");
    }, 700);
  } catch (error) {
    console.error(error);
    showToast("error", "Login failed. Try again.");
  } finally {
    setLoading(false);
  }
}

  return (
    <>
      <style>
        {`
          .aj-login-page {
            position: relative;
            min-height: calc(100vh - 120px);
            padding: 20px 0 32px;
            overflow: hidden;
          }

          .aj-login-page::before,
          .aj-login-page::after {
            content: "";
            position: absolute;
            border-radius: 9999px;
            filter: blur(70px);
            pointer-events: none;
            z-index: 0;
          }

          .aj-login-page::before {
            width: 240px;
            height: 240px;
            top: 20px;
            left: -90px;
            background: rgba(168, 85, 247, 0.18);
          }

          .aj-login-page::after {
            width: 280px;
            height: 280px;
            right: -100px;
            bottom: 30px;
            background: rgba(236, 72, 153, 0.18);
          }

          .aj-login-wrap {
            position: relative;
            z-index: 1;
            max-width: 520px;
            margin: 0 auto;
          }

          .aj-login-card {
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            padding: 22px 16px 18px;
            border: 1px solid rgba(255,255,255,0.12);
            background: linear-gradient(135deg, rgba(18,22,48,0.95), rgba(48,15,56,0.85));
            box-shadow: 0 22px 50px rgba(0,0,0,0.32);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }

          .aj-login-card::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 30%),
              linear-gradient(180deg, rgba(255,255,255,0.04), transparent 42%);
            pointer-events: none;
          }

          .aj-login-inner {
            position: relative;
            z-index: 1;
          }

          .aj-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            margin-bottom: 16px;
            font-size: 12px;
            font-weight: 700;
            color: #e9d5ff;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
          }

          .aj-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: linear-gradient(135deg, #a855f7, #ec4899);
          }

          .aj-title {
            font-size: clamp(2rem, 6vw, 2.6rem);
            font-weight: 800;
            color: #fff;
            margin: 0;
            line-height: 1.05;
          }

          .aj-title span {
            background: linear-gradient(135deg, #a855f7, #ec4899, #ffffff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .aj-sub {
            margin-top: 10px;
            font-size: 14px;
            color: rgba(255,255,255,0.75);
            line-height: 1.7;
          }

          .aj-form {
            margin-top: 20px;
            display: grid;
            gap: 14px;
          }

          .aj-group {
            display: grid;
            gap: 8px;
          }

          .aj-label {
            font-size: 13px;
            font-weight: 700;
            color: #eee;
          }

          .aj-input {
            width: 100%;
            height: 50px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
            padding: 0 14px;
            color: white;
            font-size: 14px;
            outline: none;
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          }

          .aj-input::placeholder {
            color: rgba(255,255,255,0.42);
          }

          .aj-input:focus {
            border-color: #ec4899;
            box-shadow: 0 0 0 3px rgba(236,72,153,0.2);
            background: rgba(255,255,255,0.07);
          }

          .aj-btn {
            height: 50px;
            border-radius: 999px;
            border: none;
            font-weight: 700;
            font-size: 14px;
            color: white;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            cursor: pointer;
            box-shadow: 0 16px 34px rgba(217,70,239,0.28);
            transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
          }

          .aj-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 18px 38px rgba(217,70,239,0.36);
          }

          .aj-btn:disabled {
            opacity: 0.72;
            cursor: not-allowed;
            transform: none;
          }

          .aj-links {
            margin-top: 16px;
            display: grid;
            gap: 10px;
          }

          .aj-link-btn {
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            text-decoration: none;
            color: white;
            font-weight: 600;
            transition: transform 0.18s ease, background 0.18s ease;
          }

          .aj-link-btn:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.08);
          }

          .aj-toast-wrap {
            position: fixed;
            top: 18px;
            right: 18px;
            z-index: 9999;
            display: flex;
            justify-content: flex-end;
            pointer-events: none;
          }

          .aj-toast {
            min-width: 260px;
            max-width: 360px;
            padding: 14px 16px;
            border-radius: 16px;
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            border: 1px solid rgba(255,255,255,0.14);
            box-shadow: 0 20px 60px rgba(0,0,0,0.35);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            animation: aj-toast-in 0.24s ease;
            pointer-events: auto;
          }

          .aj-toast-success {
            background: linear-gradient(135deg, rgba(34,197,94,0.96), rgba(16,185,129,0.94));
          }

          .aj-toast-error {
            background: linear-gradient(135deg, rgba(239,68,68,0.96), rgba(190,24,93,0.94));
          }

          @keyframes aj-toast-in {
            from {
              opacity: 0;
              transform: translateY(-10px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (min-width: 640px) {
            .aj-login-page {
              padding: 36px 0 44px;
            }

            .aj-login-card {
              padding: 28px 24px 22px;
            }

            .aj-links {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}
      </style>

      {toast && (
        <div className="aj-toast-wrap">
          <div
            className={`aj-toast ${
              toast.type === "success" ? "aj-toast-success" : "aj-toast-error"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="aj-login-page">
        <div className="aj-login-wrap">
          <div className="aj-login-card">
            <div className="aj-login-inner">
              <div className="aj-badge">
                <span className="aj-dot" />
                Customer Access
              </div>

              <h1 className="aj-title">
                Customer <span>Login</span>
              </h1>

              <p className="aj-sub">
               Login with your Customer ID or Mobile Number and Password to
                access the Dashboard.
              </p>

              <form onSubmit={handleLogin} className="aj-form">
                <div className="aj-group">
                  <label className="aj-label">Mobile Number</label>
                  <input
                    className="aj-input"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Customer ID or Mobile Number"/>
                </div>
                <div className="aj-group">
                  <label className="aj-label">Password</label>
                  <input
                    type="password"
                    className="aj-input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="aj-btn" disabled={loading}>
                  {loading ? "Logging in..." : "Login to Portal"}
                </button>
              </form>

              <div className="aj-links">
                <Link to="/" className="aj-link-btn">
                  Home
                </Link>
                <Link to="/admin" className="aj-link-btn">
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}