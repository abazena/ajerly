"use client";
import { useEffect } from "react";

// Overlay + sheet/modal shell matching the prototype's .overlay/.modal.
export default function Modal({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="overlay show" onClick={onClose} />
      <div className="modal show" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mhead">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="إغلاق">
            <svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>
        <div className="mbody">{children}</div>
      </div>
    </>
  );
}
