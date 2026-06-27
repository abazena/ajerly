"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { OperatorAuthProvider, useOperator } from "@/lib/operatorAuth";
import { OperatorUIProvider } from "@/components/operatorUi";

const NAV = [
  { href: "/console", label: "لوحة التحكم" },
  { href: "/console/offices", label: "المكاتب" },
  { href: "/console/vouchers", label: "القسائم" },
];

function active(pathname: string, href: string) {
  return href === "/console" ? pathname === "/console" : pathname.startsWith(href);
}

function ConsoleShell({ children }: { children: React.ReactNode }) {
  const { status, op, logout } = useOperator();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/console/login";

  useEffect(() => {
    if (!isLogin && status === "anon") router.replace("/console/login");
  }, [isLogin, status, router]);

  // Login route is public — render it without the guard/chrome.
  if (isLogin) return <>{children}</>;

  if (status !== "authed") {
    return <div className="authpage"><div><div className="spinner" /><div className="state">جارٍ التحميل…</div></div></div>;
  }

  return (
    <div className="op">
      <header className="opbar">
        <div className="logo">أجرلي<span className="dot">.</span> <small>كونسول المشغّل</small></div>
        <nav className="opnav">
          {NAV.map((n) => <Link key={n.href} href={n.href} className={active(pathname, n.href) ? "on" : ""}>{n.label}</Link>)}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="s" style={{ color: "var(--faint)", fontWeight: 700, fontSize: 13 }}>{op?.name}</span>
          <button className="linkbtn" onClick={logout}>خروج</button>
        </div>
      </header>
      <main className="op-main">{children}</main>
    </div>
  );
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <OperatorAuthProvider>
      <OperatorUIProvider>
        <ConsoleShell>{children}</ConsoleShell>
      </OperatorUIProvider>
    </OperatorAuthProvider>
  );
}
