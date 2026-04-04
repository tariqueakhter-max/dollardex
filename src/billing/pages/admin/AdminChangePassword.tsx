import { useState } from "react";
import { changeAdminPassword, getAdminUsername } from "../../lib/billing-auth";

const sectionCardStyle: React.CSSProperties = {
  maxWidth: 620,
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(30,41,59,0.62) 100%)",
  border: "1px solid rgba(244,114,182,0.14)",
  borderRadius: 24,
  padding: 20,
  boxShadow: "0 16px 34px rgba(0,0,0,0.20)",
  backdropFilter: "blur(10px)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(2, 6, 23, 0.46)",
  border: "1px solid rgba(244,114,182,0.18)",
  color: "#fff",
  borderRadius: 16,
  padding: "10px 12px",
};

const primaryBtn: React.CSSProperties = {
  padding: "14px 26px",
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(135deg, #d946ef 0%, #ec4899 55%, #f472b6 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(217,70,239,0.24)",
};

export default function AdminChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const username = getAdminUsername();

      if (!username) {
        alert("Admin session not found. Please login again.");
        return;
      }

      if (!newPassword.trim()) {
        alert("New password is required");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match");
        return;
      }

      await changeAdminPassword(username, currentPassword, newPassword);

      alert("Password changed successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      alert(error.message || "Failed to change password");
    }
  }

  return (
    <div style={sectionCardStyle}>
      <h1
        className="billing-page-title"
        style={{
          marginBottom: 8,
          color: "#fff7fb",
          textShadow: "0 2px 14px rgba(217,70,239,0.28)",
        }}
      >
        Change Password
      </h1>

      <p
        className="billing-page-subtitle"
        style={{
          color: "rgba(255,255,255,0.78)",
          marginBottom: 20,
        }}
      >
        Update your admin login password.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label className="billing-label" style={{ color: "rgba(255,255,255,0.78)" }}>
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="billing-label" style={{ color: "rgba(255,255,255,0.78)" }}>
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="billing-label" style={{ color: "rgba(255,255,255,0.78)" }}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button type="submit" style={primaryBtn}>
          Change Password
        </button>
      </form>
    </div>
  );
}