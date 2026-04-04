export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        padding: "20px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}
    >
      {children}
    </div>
  );
}