import { useEffect } from "react";

export default function Toast({ show, message, type = "success", onClose }) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div style={wrapStyle}>
      <div
        className="card"
        style={{
          ...toastStyle,
          borderLeft:
            type === "success"
              ? "6px solid #22c55e"
              : type === "error"
              ? "6px solid #ef4444"
              : "6px solid #f59e0b",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          {type === "success"
            ? "✅ Sucesso"
            : type === "error"
            ? "❌ Erro"
            : "⚠️ Aviso"}
        </div>

        <div style={{ opacity: 0.85, fontSize: 14 }}>{message}</div>

        <button onClick={onClose} style={closeBtn}>
          ✕
        </button>
      </div>
    </div>
  );
}

const wrapStyle = {
  position: "fixed",
  right: 20,
  bottom: 20,
  zIndex: 99999,
};

const toastStyle = {
  position: "relative",
  padding: "14px 16px",
  minWidth: 280,
  maxWidth: 360,
};

const closeBtn = {
  position: "absolute",
  right: 10,
  top: 10,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 16,
  opacity: 0.7,
};
