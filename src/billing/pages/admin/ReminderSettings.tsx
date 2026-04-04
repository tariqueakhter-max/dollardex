
import { useEffect, useState } from "react";
import {
  ensureReminderSettings,
  updateReminderSettings,
  type ReminderSettings as ReminderSettingsType,
} from "../../lib/billing-reminders";

type ToastState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

export default function ReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettingsType | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [daysBefore, setDaysBefore] = useState(3);
  const [channel, setChannel] = useState("whatsapp");
  const [sendHour, setSendHour] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    load();
  }, []);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await ensureReminderSettings();
      setSettings(data);
      setEnabled(Boolean(data.enabled));
      setDaysBefore(Number(data.days_before_expiry || 3));
      setChannel(data.channel || "whatsapp");
      setSendHour(Number(data.send_hour || 10));
    } catch (error) {
      console.error("Failed to load reminder settings:", error);
      showToast("error", "Failed to load reminder settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    try {
      setSaving(true);
      await updateReminderSettings(settings.id, {
        enabled,
        days_before_expiry: Math.max(0, Number(daysBefore || 0)),
        channel,
        send_hour: Math.max(0, Math.min(23, Number(sendHour || 10))),
      });

      showToast("success", "Reminder settings saved");
      await load();
    } catch (error) {
      console.error("Failed to save settings:", error);
      showToast("error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const sectionCardStyle: React.CSSProperties = {
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
    padding: "12px 18px",
    borderRadius: 16,
    border: "none",
    background:
      "linear-gradient(135deg, #d946ef 0%, #ec4899 55%, #f472b6 100%)",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(217,70,239,0.24)",
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <style>
        {`
          .aj-toast-wrap {
            position: sticky;
            top: 14px;
            z-index: 60;
            display: flex;
            justify-content: flex-end;
            pointer-events: none;
            margin-bottom: 8px;
          }

          .aj-toast {
            min-width: 260px;
            max-width: 420px;
            border-radius: 18px;
            padding: 14px 16px;
            color: white;
            font-weight: 700;
            box-shadow: 0 18px 42px rgba(0,0,0,0.28);
            border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(14px);
            pointer-events: auto;
          }

          .aj-toast-success {
            background: linear-gradient(135deg, rgba(16,185,129,0.92), rgba(5,150,105,0.92));
          }

          .aj-toast-error {
            background: linear-gradient(135deg, rgba(225,29,72,0.92), rgba(190,24,93,0.92));
          }
        `}
      </style>

      {toast && (
        <div className="aj-toast-wrap">
          <div className={`aj-toast ${toast.type === "success" ? "aj-toast-success" : "aj-toast-error"}`}>
            {toast.message}
          </div>
        </div>
      )}

      <div style={sectionCardStyle}>
        <h1
          style={{
            marginBottom: 8,
            color: "#fff7fb",
            textShadow: "0 2px 14px rgba(217,70,239,0.28)",
          }}
        >
          Reminder Settings
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            marginBottom: 20,
          }}
        >
          Configure WhatsApp reminders for customers before expiry or due.
        </p>

        {loading ? (
          <div style={{ color: "rgba(255,255,255,0.72)" }}>Loading settings...</div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  accentColor: "#ec4899",
                  cursor: "pointer",
                }}
              />

              <span
                style={{
                  color: "#fdf2f8",
                  fontWeight: 600,
                }}
              >
                Enable Reminders
              </span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "rgba(255,255,255,0.78)",
                  fontWeight: 600,
                }}
              >
                Days Before Expiry
              </label>

              <input
                type="number"
                value={daysBefore}
                onChange={(e) => setDaysBefore(Number(e.target.value))}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "rgba(255,255,255,0.78)",
                  fontWeight: 600,
                }}
              >
                Channel
              </label>

              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                style={inputStyle}
              >
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "rgba(255,255,255,0.78)",
                  fontWeight: 600,
                }}
              >
                Daily Send Hour (0-23)
              </label>

              <input
                type="number"
                min={0}
                max={23}
                value={sendHour}
                onChange={(e) => setSendHour(Number(e.target.value))}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleSave} style={primaryBtn} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}