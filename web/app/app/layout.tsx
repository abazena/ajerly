"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TenantAuthProvider, useAuth } from "@/lib/auth";
import { UIProvider, useUI } from "@/components/ui";
import { dateFull } from "@/lib/format";

const NAV = [
  { href: "/app", label: "نظرة عامة", icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></> },
  { href: "/app/cars", label: "السيارات", icon: <><path d="M5 17h14M6.5 17l1-5.5a2 2 0 0 1 2-1.6h5a2 2 0 0 1 2 1.6l1 5.5" /><path d="M5 17v2M19 17v2" /></> },
  { href: "/app/customers", label: "العملاء", icon: <><path d="M3 21h18M5 21V8l7-4 7 4v13" /><path d="M9 21v-5h6v5" /></> },
  { href: "/app/ledger", label: "الدفتر", icon: <><path d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z" /><path d="M8 7h6M8 11h6M8 15h3" /></> },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}
function titleFor(pathname: string) {
  if (pathname.startsWith("/app/customers/") && pathname !== "/app/customers") return "كشف الحساب";
  if (pathname.startsWith("/app/settings")) return "الإعدادات";
  return NAV.find((n) => isActive(pathname, n.href))?.label ?? "أجرلي";
}

function Shell({ children }: { children: React.ReactNode }) {
  const { status, user, office, readonly, logout } = useAuth();
  const ui = useUI();
  const pathname = usePathname();
  const router = useRouter();
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (status === "anon") router.replace("/login");
  }, [status, router]);

  if (status !== "authed") {
    return <div className="authpage"><div><div className="spinner" /><div className="state">جارٍ التحميل…</div></div></div>;
  }

  const sub = office!.subscription;
  const onOverview = pathname === "/app";

  return (
    <div className="shell">
      <aside className="side">
        <div>
          <div className="logo"><img src="/logos/ajerly-ver-logo.png" alt="أجرلي" /></div>
          <div className="office">{office!.name}</div>
          <div className="username">{user!.name}</div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={isActive(pathname, n.href) ? "on" : ""}>
              <svg viewBox="0 0 24 24">{n.icon}</svg>{n.label}
            </Link>
          ))}
          <span className="lbl" style={{ marginTop: 14 }}>قريباً</span>
          <a className="soon" onClick={() => ui.toast("هذه الميزة قادمة قريباً")}><svg viewBox="0 0 24 24"><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>العقود<span className="soon-tag">قريباً</span></a>
        </nav>
        <div className="side-foot">
          <nav className="nav">
            <Link href="/app/settings" className={pathname.startsWith("/app/settings") ? "on" : ""}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></svg>الإعدادات</Link>
            <a className="soon" onClick={logout}><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>تسجيل الخروج</a>
          </nav>
        </div>
      </aside>

      <main className="main">
        <div className="top">
          <div><h1>{titleFor(pathname)}</h1><div className="date">{dateFull(new Date())}</div></div>
          <div className="actions">
            {!readonly && <>
              <button className="btn expense" onClick={() => ui.openTxn("out")}><span className="pm">−</span>تسجيل مصروف</button>
              <button className="btn income" onClick={() => ui.openTxn("in")}><span className="pm">+</span>تسجيل دخل</button>
            </>}
          </div>
        </div>

        {!onOverview && (
          <div className="mtop"><div className="mt-title">{titleFor(pathname)}</div></div>
        )}

        {readonly && (
          <div className={`banner ${sub.suspended ? "bad" : ""}`}>
            <span>{sub.suspended ? "تم تعليق الحساب من قبل المشغّل — التطبيق للقراءة فقط." : "انتهى اشتراكك — التطبيق للقراءة فقط حتى التجديد."}</span>
            {!sub.suspended && <Link href="/app/settings">جدّد الآن ←</Link>}
          </div>
        )}

        {children}
      </main>

      {/* mobile bottom nav */}
      <nav className="bottomnav">
        <Link href="/app" className={`bn ${pathname === "/app" ? "on" : ""}`}><svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>الرئيسية</Link>
        <Link href="/app/cars" className={`bn ${pathname.startsWith("/app/cars") ? "on" : ""}`}><svg viewBox="0 0 24 24"><path d="M5 17h14M6.5 17l1-5.5a2 2 0 0 1 2-1.6h5a2 2 0 0 1 2 1.6l1 5.5" /><path d="M5 17v2M19 17v2" /></svg>السيارات</Link>
        <button className="bn-fab" onClick={() => !readonly && setSheet(true)} aria-label="إضافة"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></button>
        <Link href="/app/customers" className={`bn ${pathname.startsWith("/app/customers") ? "on" : ""}`}><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13" /><path d="M9 21v-5h6v5" /></svg>العملاء</Link>
        <Link href="/app/ledger" className={`bn ${pathname.startsWith("/app/ledger") ? "on" : ""}`}><svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z" /><path d="M8 7h6M8 11h6" /></svg>الدفتر</Link>
      </nav>

      {/* mobile quick-add sheet */}
      {sheet && <div className="overlay show" onClick={() => setSheet(false)} />}
      <div className={`sheet ${sheet ? "show" : ""}`}>
        <div className="grab" />
        <h4>ما نوع الحركة؟</h4>
        <div className="opts">
          <button className="opt in" onClick={() => { setSheet(false); ui.openTxn("in"); }}><span className="pm">+</span>تسجيل دخل</button>
          <button className="opt out" onClick={() => { setSheet(false); ui.openTxn("out"); }}><span className="pm">−</span>تسجيل مصروف</button>
        </div>
      </div>
    </div>
  );
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantAuthProvider>
      <UIProvider>
        <Shell>{children}</Shell>
      </UIProvider>
    </TenantAuthProvider>
  );
}
