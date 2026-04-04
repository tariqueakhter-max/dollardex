
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginAdmin, validateAdminLogin } from "../../lib/billing-auth";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
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
    setLoading(true);

    try {
      const admin = await validateAdminLogin(username, password);

      if (!admin) {
        showToast("error", "Invalid admin credentials");
        return;
      }

loginAdmin(username);
      showToast("success", "Login successful");

      setTimeout(() => {
        navigate("/ajcomputers_billing/admin/dashboard");
      }, 700);
    } catch (error) {
      console.error(error);
      showToast("error", "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>
        {`
.aj-admin-login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}
            position: relative;
min-height: 100vh;
display: flex;
align-items: center;
justify-content: center;
            padding: 20px 0 32px;
            overflow: hidden;
          }

          .aj-admin-login-page::before,
          .aj-admin-login-page::after {
            content: "";
            position: absolute;
            border-radius: 9999px;
            filter: blur(70px);
            pointer-events: none;
            z-index: 0;
          }

          .aj-admin-login-page::before {
            width: 240px;
            height: 240px;
            top: 20px;
            left: -90px;
            background: rgba(236, 72, 153, 0.16);
          }

          .aj-admin-login-page::after {
            width: 280px;
            height: 280px;
            right: -100px;
            bottom: 30px;
            background: rgba(168, 85, 247, 0.16);
          }

          .aj-admin-login-wrap {
            position: relative;
            z-index: 1;
            max-width: 520px;
            margin: 0 auto;
          }

          .aj-admin-login-card {
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            padding: 22px 16px 18px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background:
              linear-gradient(135deg, rgba(28, 12, 34, 0.94), rgba(48, 15, 56, 0.84));
            box-shadow:
              0 22px 50px rgba(0, 0, 0, 0.32),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }

          .aj-admin-login-card::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent 30%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 42%);
            pointer-events: none;
          }

          .aj-admin-login-inner {
            position: relative;
            z-index: 1;
          }

          .aj-admin-top-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            margin-bottom: 16px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: #ffd8ee;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
          }

          .aj-admin-top-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: linear-gradient(135deg, #ff4da6, #d946ef);
            box-shadow: 0 0 12px rgba(255, 77, 166, 0.8);
            flex: 0 0 auto;
          }

          .aj-admin-login-title {
            margin: 0;
            font-size: clamp(2rem, 6vw, 2.6rem);
            line-height: 1.05;
            font-weight: 800;
            letter-spacing: -0.03em;
            color: #fff7fc;
          }

          .aj-admin-login-title span {
            background: linear-gradient(135deg, #ff78c9 0%, #f0abfc 55%, #ffffff 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .aj-admin-login-subtitle {
            margin: 12px 0 0;
            font-size: 14px;
            line-height: 1.75;
            color: rgba(255, 235, 247, 0.82);
          }

          .aj-admin-login-form {
            margin-top: 20px;
            display: grid;
            gap: 14px;
          }

          .aj-admin-form-group {
            display: grid;
            gap: 8px;
          }

          .aj-admin-label {
            font-size: 13px;
            font-weight: 700;
            color: #ffe6f4;
          }

          .aj-admin-input-wrap {
            position: relative;
          }

          .aj-admin-input {
            width: 100%;
            height: 52px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.05);
            padding: 0 16px;
            font-size: 14px;
            color: #fff;
            outline: none;
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          }

          .aj-admin-input::placeholder {
            color: rgba(255, 235, 247, 0.4);
          }

          .aj-admin-input:focus {
            border-color: rgba(244, 114, 182, 0.7);
            background: rgba(255, 255, 255, 0.07);
            box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.12);
          }

          .aj-admin-login-button {
            width: 100%;
            height: 52px;
            border: 0;
            border-radius: 999px;
            font-size: 15px;
            font-weight: 800;
            color: #fff;
            cursor: pointer;
            background: linear-gradient(135deg, #ec4899 0%, #c026d3 100%);
            box-shadow: 0 16px 34px rgba(217, 70, 239, 0.3);
            transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
          }

          .aj-admin-login-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 18px 38px rgba(217, 70, 239, 0.38);
          }

          .aj-admin-login-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }

          .aj-admin-login-footer {
            margin-top: 16px;
            display: grid;
            gap: 10px;
          }

          .aj-admin-link-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .aj-admin-link-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 46px;
            padding: 0 16px;
            border-radius: 999px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            color: #fff7fc;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          }

          .aj-admin-link-btn:hover {
            transform: translateY(-1px);
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.18);
          }

          .aj-admin-note {
            margin: 2px 0 0;
            text-align: center;
            font-size: 12px;
            line-height: 1.6;
            color: rgba(255, 235, 247, 0.62);
          }

          .aj-admin-toast-wrap {
            position: fixed;
            top: 18px;
            right: 18px;
            z-index: 9999;
            display: flex;
            justify-content: flex-end;
            pointer-events: none;
          }

          .aj-admin-toast {
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
            animation: aj-admin-toast-in 0.24s ease;
            pointer-events: auto;
          }

          .aj-admin-toast-success {
            background: linear-gradient(135deg, rgba(34,197,94,0.96), rgba(16,185,129,0.94));
          }

          .aj-admin-toast-error {
            background: linear-gradient(135deg, rgba(239,68,68,0.96), rgba(190,24,93,0.94));
          }

          @keyframes aj-admin-toast-in {
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
.aj-admin-login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}
              padding: 36px 0 44px;
            }

            .aj-admin-login-card {
              padding: 28px 24px 22px;
            }

            .aj-admin-link-row {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
        `}
      </style>

      {toast && (
        <div className="aj-admin-toast-wrap">
          <div
            className={`aj-admin-toast ${
              toast.type === "success" ? "aj-admin-toast-success" : "aj-admin-toast-error"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="aj-admin-login-page">
        <div className="aj-admin-login-wrap">
          <div className="aj-admin-login-card">
            <div className="aj-admin-login-inner">
              <div className="aj-admin-top-badge">
                <span className="aj-admin-top-dot" />
                Secure Admin Access
              </div>

              <h1 className="aj-admin-login-title">
                Admin <span>Login</span>
              </h1>

              <p className="aj-admin-login-subtitle">
                Access the AJ Computers Billing dashboard to manage customers,
                renewals, due amounts, and payment records from one place.
              </p>

              <form onSubmit={handleLogin} className="aj-admin-login-form">
                <div className="aj-admin-form-group">
                  <label className="aj-admin-label">Username</label>
                  <div className="aj-admin-input-wrap">
                    <input
                      className="aj-admin-input"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="aj-admin-form-group">
                  <label className="aj-admin-label">Password</label>
                  <div className="aj-admin-input-wrap">
                    <input
                      type="password"
                      className="aj-admin-input"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="aj-admin-login-button"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login to Dashboard"}
                </button>
              </form>

              <div className="aj-admin-login-footer">
                <div className="aj-admin-link-row">
                  <Link to="/ajcomputers_billing" className="aj-admin-link-btn">
                    Back to Home
                  </Link>

                  <Link
                    to="/ajcomputers_billing/portal/login"
                    className="aj-admin-link-btn"
                  >
                    Customer Login
                  </Link>
                </div>

                <p className="aj-admin-note">
                  AJ Computers Billing • Broadband • IPTV • OTT • IP Telephony
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}