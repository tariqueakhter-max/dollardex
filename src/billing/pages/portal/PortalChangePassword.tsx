
import { useState } from "react";
import { Link } from "react-router-dom";
import { getPortalCustomerId } from "../../lib/billing-auth";
import { changeCustomerPassword } from "../../lib/billing-storage";

export default function PortalChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const customerId = getPortalCustomerId();

    if (!customerId) {
      alert("Customer session not found");
      return;
    }

    if (!currentPassword.trim()) {
      alert("Current password is required");
      return;
    }

    if (!newPassword.trim()) {
      alert("New password is required");
      return;
    }

    if (newPassword.length < 4) {
      alert("New password must be at least 4 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await changeCustomerPassword(
        customerId,
        currentPassword,
        newPassword
      );

      if (!result.success) {
        alert(result.message || "Failed to change password");
        return;
      }

      alert("Password changed successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      alert("Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>
        {`
          .aj-portal-pass-page {
            position: relative;
            overflow: hidden;
            padding: 16px 0 28px;
            min-height: calc(100vh - 120px);
          }

          .aj-portal-pass-page::before,
          .aj-portal-pass-page::after {
            content: "";
            position: absolute;
            border-radius: 9999px;
            filter: blur(72px);
            pointer-events: none;
            z-index: 0;
          }

          .aj-portal-pass-page::before {
            width: 240px;
            height: 240px;
            top: -30px;
            left: -90px;
            background: rgba(168, 85, 247, 0.18);
          }

          .aj-portal-pass-page::after {
            width: 300px;
            height: 300px;
            right: -110px;
            top: 180px;
            background: rgba(236, 72, 153, 0.16);
          }

          .aj-portal-pass-wrap {
            position: relative;
            z-index: 1;
            max-width: 760px;
            margin: 0 auto;
            display: grid;
            gap: 16px;
          }

          .aj-portal-pass-card {
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            border: 1px solid rgba(255,255,255,0.12);
            background: linear-gradient(135deg, rgba(18,22,48,0.95), rgba(48,15,56,0.84));
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            box-shadow:
              0 22px 52px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.06);
          }

          .aj-portal-pass-card::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 30%),
              linear-gradient(180deg, rgba(255,255,255,0.04), transparent 42%);
            pointer-events: none;
          }

          .aj-portal-pass-inner {
            position: relative;
            z-index: 1;
            padding: 20px 16px;
          }

          .aj-portal-pass-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            color: #e9d5ff;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
          }

          .aj-portal-pass-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: linear-gradient(135deg, #a855f7, #ec4899);
          }

          .aj-portal-pass-head {
            display: grid;
            gap: 14px;
            margin-top: 16px;
          }

          .aj-portal-pass-title {
            margin: 0;
            font-size: clamp(1.9rem, 6vw, 2.7rem);
            line-height: 1.05;
            font-weight: 800;
            color: #ffffff;
          }

          .aj-portal-pass-title span {
            background: linear-gradient(135deg, #a855f7, #ec4899, #ffffff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .aj-portal-pass-subtitle {
            margin: 0;
            max-width: 720px;
            color: rgba(255,255,255,0.78);
            font-size: 14px;
            line-height: 1.75;
          }

          .aj-portal-pass-top-actions {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .aj-portal-pass-link {
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
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.12);
            transition: transform 0.18s ease, background 0.18s ease;
          }

          .aj-portal-pass-link:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.09);
          }

          .aj-portal-pass-form-card {
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            border: 1px solid rgba(255,255,255,0.12);
            background: linear-gradient(135deg, rgba(18,22,48,0.95), rgba(48,15,56,0.84));
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            box-shadow:
              0 22px 52px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.06);
          }

          .aj-portal-pass-form-card::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 30%),
              linear-gradient(180deg, rgba(255,255,255,0.04), transparent 42%);
            pointer-events: none;
          }

          .aj-portal-pass-form-inner {
            position: relative;
            z-index: 1;
            padding: 20px 16px;
          }

          .aj-portal-pass-section-kicker {
            margin: 0 0 6px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #f0abfc;
          }

          .aj-portal-pass-section-title {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 800;
            color: #ffffff;
          }

          .aj-portal-pass-section-text {
            margin: 8px 0 0;
            font-size: 14px;
            line-height: 1.7;
            color: rgba(255,255,255,0.74);
          }

          .aj-portal-pass-form {
            margin-top: 18px;
            display: grid;
            gap: 14px;
          }

          .aj-portal-pass-group {
            display: grid;
            gap: 8px;
          }

          .aj-portal-pass-label {
            font-size: 13px;
            font-weight: 700;
            color: #ffe6f4;
          }

          .aj-portal-pass-input {
            width: 100%;
            height: 52px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.05);
            padding: 0 16px;
            font-size: 14px;
            color: #ffffff;
            outline: none;
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          }

          .aj-portal-pass-input::placeholder {
            color: rgba(255,255,255,0.38);
          }

          .aj-portal-pass-input:focus {
            border-color: rgba(244, 114, 182, 0.72);
            background: rgba(255,255,255,0.07);
            box-shadow: 0 0 0 4px rgba(236,72,153,0.14);
          }

          .aj-portal-pass-hint {
            margin-top: 4px;
            font-size: 12px;
            line-height: 1.6;
            color: rgba(255,255,255,0.58);
          }

          .aj-portal-pass-submit {
            width: 100%;
            min-height: 52px;
            border: 0;
            border-radius: 999px;
            font-size: 15px;
            font-weight: 800;
            color: white;
            cursor: pointer;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            box-shadow: 0 16px 34px rgba(217,70,239,0.28);
            transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
          }

          .aj-portal-pass-submit:hover {
            transform: translateY(-1px);
            box-shadow: 0 18px 38px rgba(217,70,239,0.36);
          }

          .aj-portal-pass-submit:disabled {
            opacity: 0.72;
            cursor: not-allowed;
            transform: none;
          }

          @media (min-width: 640px) {
            .aj-portal-pass-page {
              padding: 22px 0 34px;
            }

            .aj-portal-pass-inner,
            .aj-portal-pass-form-inner {
              padding: 24px 22px;
            }

            .aj-portal-pass-top-actions {
              grid-template-columns: repeat(2, minmax(0, auto));
              justify-content: start;
            }
          }

          @media (min-width: 960px) {
            .aj-portal-pass-head {
              grid-template-columns: minmax(0, 1fr) auto;
              align-items: end;
            }
          }
        `}
      </style>

      <div className="aj-portal-pass-page">
        <div className="aj-portal-pass-wrap">
          <section className="aj-portal-pass-card">
            <div className="aj-portal-pass-inner">
              <div className="aj-portal-pass-badge">
                <span className="aj-portal-pass-dot" />
                Customer Security
              </div>

              <div className="aj-portal-pass-head">
                <div>
                  <h1 className="aj-portal-pass-title">
                    Change <span>Password</span>
                  </h1>
                  <p className="aj-portal-pass-subtitle">
                    Update your portal password to keep your billing account secure.
                    Choose a password you can remember easily but others cannot guess.
                  </p>
                </div>

                <div className="aj-portal-pass-top-actions">
                  <Link
                    to="/ajcomputers_billing/portal/dashboard"
                    className="aj-portal-pass-link"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="aj-portal-pass-form-card">
            <div className="aj-portal-pass-form-inner">
              <p className="aj-portal-pass-section-kicker">Update access</p>
              <h2 className="aj-portal-pass-section-title">Password Details</h2>
              <p className="aj-portal-pass-section-text">
                Enter your current password, then set a new password for your customer portal login.
              </p>

              <form onSubmit={handleSubmit} className="aj-portal-pass-form">
                <div className="aj-portal-pass-group">
                  <label className="aj-portal-pass-label">Current Password</label>
                  <input
                    type="password"
                    className="aj-portal-pass-input"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="aj-portal-pass-group">
                  <label className="aj-portal-pass-label">New Password</label>
                  <input
                    type="password"
                    className="aj-portal-pass-input"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="aj-portal-pass-group">
                  <label className="aj-portal-pass-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="aj-portal-pass-input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <div className="aj-portal-pass-hint">
                    Use at least 4 characters. Make sure the new password matches the confirmation password.
                  </div>
                </div>

                <button
                  type="submit"
                  className="aj-portal-pass-submit"
                  disabled={loading}
                >
                  {loading ? "Changing Password..." : "Change Password"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}