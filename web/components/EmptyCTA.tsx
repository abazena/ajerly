"use client";
import type { ReactNode } from "react";

// Empty state with a primary call-to-action. Replaces the silent "no rows yet"
// placeholders on index pages so a new user sees what to do, not just that
// there's nothing to see.
export default function EmptyCTA({ icon, title, body, cta, onClick }: {
  icon?: ReactNode;
  title: string;
  body?: string;
  cta?: string;
  onClick?: () => void;
}) {
  return (
    <div className="empty-cta">
      {icon && <div className="empty-cta-icon">{icon}</div>}
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {cta && onClick && (
        <button className="btn brand" onClick={onClick}>
          <span className="pm">+</span>{cta}
        </button>
      )}
    </div>
  );
}
