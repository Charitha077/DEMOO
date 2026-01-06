import { useEffect } from "react";

export default function GlobalAlert({ msg, type, onClose }) {
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [msg, onClose]);

  if (!msg) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs shadow-md border
        ${type === "error" 
          ? "bg-red-50 text-red-700 border-red-300" 
          : "bg-green-50 text-green-700 border-green-300"}
      `}
      >
        <span
          className={`w-5 h-5 flex items-center justify-center rounded-full text-white font-bold
          ${type === "error" ? "bg-red-500" : "bg-green-500"}
        `}
        >
          {type === "error" ? "✕" : "✓"}
        </span>
        <span className="text-sm font-medium">{msg}</span>
      </div>
    </div>
  );
}