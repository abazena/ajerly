"use client";
import { useUI } from "./ui";

// Visible only while the office has empty essentials. Each step is a tappable
// CTA that opens the relevant modal. The panel hides itself once both core
// actions are done — no dismiss state needed, no localStorage.
export default function GettingStartedCard({
  ownerName,
  hasCars,
  hasTransactions,
}: {
  ownerName?: string;
  hasCars: boolean;
  hasTransactions: boolean;
}) {
  const ui = useUI();
  if (hasCars && hasTransactions) return null;

  const steps: Array<{ done: boolean; title: string; cta: string; onClick: () => void }> = [
    {
      done: hasCars,
      title: "أضف سيارتك الأولى",
      cta: "إضافة سيارة",
      onClick: () => ui.openCar(),
    },
    {
      done: hasTransactions,
      title: "سجّل أول حركة (دخل أو مصروف)",
      cta: "تسجيل دخل",
      onClick: () => ui.openTxn("in"),
    },
  ];

  return (
    <section className="onboard">
      <div className="onboard-head">
        <div>
          <h2>أهلاً{ownerName ? ` ${ownerName}` : ""} 👋</h2>
          <p>ابدأ بهاتين الخطوتين السريعتين ليصبح المكتب جاهزاً.</p>
        </div>
      </div>
      <ol className="onboard-steps">
        {steps.map((s, i) => (
          <li key={i} className={`onboard-step ${s.done ? "done" : ""}`}>
            <span className="onboard-num">
              {s.done ? (
                <svg viewBox="0 0 24 24" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
              ) : i + 1}
            </span>
            <div className="onboard-text">{s.title}</div>
            {!s.done && (
              <button className="btn brand" onClick={s.onClick}>
                <span className="pm">+</span>{s.cta}
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
