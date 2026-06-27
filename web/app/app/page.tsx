"use client";
import Link from "next/link";
import { useUI } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/useData";
import { tenant } from "@/lib/api";
import { money, timeAr } from "@/lib/format";
import CarThumb from "@/components/CarThumb";
import GettingStartedCard from "@/components/GettingStartedCard";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";
import type { Transaction, Car } from "@/lib/types";

export default function OverviewPage() {
  const ui = useUI();
  const { user } = useAuth();
  const { data, error, loading } = useData(() => tenant.dashboard(), [ui.refreshKey]);

  if (loading && !data) return <div className="state"><div className="spinner" />جارٍ التحميل…</div>;
  if (error) return <div className="state">{error}</div>;
  if (!data) return null;

  const carById = new Map(data.cars.map((c) => [c._id, c]));
  // Car is the primary line when known — note becomes secondary context under the
  // time. Without a car, fall back to the note, then to a generic type label.
  const txnLabel = (t: Transaction): { primary: string; secondary?: string } => {
    const car = t.carId ? carById.get(t.carId) : null;
    if (car) return { primary: `${car.make} ${car.model}`, secondary: t.note ?? undefined };
    if (t.note) return { primary: t.note };
    if (t.type === "withdrawal") return { primary: "إخراج نقدية" };
    return { primary: t.type === "income" ? "دخل" : "مصروف" };
  };

  return (
    <>
      <GettingStartedCard
        ownerName={user?.name}
        hasCars={data.cars.length > 0}
        hasTransactions={data.recentTransactions.length > 0}
      />
      <InstallPWAPrompt
        ready={data.cars.length > 0 && data.recentTransactions.length > 0}
      />
      <div className="hero-row">
        <div className="card cash">
          <div className="hero-mtop">
            <div className="logo2">أجرلي<span>.</span></div>
            <Link href="/app/settings" className="gear" aria-label="الإعدادات"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></svg></Link>
          </div>
          <div><div className="k">النقدية المتوفرة</div><div className="v"><span className="big num">{money(data.cashBalance)}</span><span className="unit">د.ل</span></div></div>
          <div className="today">
            <div className="pill in"><span className="ar">▲</span><span className="num">{money(data.todayIn)}</span><span className="t">دخل اليوم</span></div>
            <div className="pill out"><span className="ar">▼</span><span className="num">{money(data.todayOut)}</span><span className="t">مصروف اليوم</span></div>
          </div>
          <Link href="/app/customers" className="owed-row">
            <div><div className="k">العملاء مدينون لك</div><div className="vv"><span className="num">{money(data.totalOwed)}</span><span className="unit">د.ل</span></div></div>
            <div className="go">عرض العملاء<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg></div>
          </Link>
        </div>

        <Link href="/app/customers" className="card stat debt ov-stat">
          <div className="head"><span className="k">العملاء مدينون لك</span><span className="ic"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13" /><path d="M9 21v-6h6v6" /></svg></span></div>
          <div><div className="v"><span className="num">{money(data.totalOwed)}</span><span className="unit">د.ل</span></div><div className="sub">إجمالي المستحقات عليهم</div></div>
        </Link>
        <Link href="/app/cars" className="card stat fleet ov-stat">
          <div className="head"><span className="k">أسطول السيارات</span><span className="ic"><svg viewBox="0 0 24 24"><path d="M5 17h14M6.5 17l1-5.5a2 2 0 0 1 2-1.6h5a2 2 0 0 1 2 1.6l1 5.5" /></svg></span></div>
          <div><div className="v"><span className="num">{data.cars.length}</span><span className="unit">سيارات</span></div><div className="sub"><b className="num">{data.paidOffCarCount}</b> سدّدت ثمنها بالكامل</div></div>
        </Link>
      </div>

      <div className="split">
        <div>
          <div className="panel-head"><h2>السيارات</h2><Link className="more" href="/app/cars">عرض الكل ←</Link></div>
          <div className="cars-grid">
            {data.cars.slice(0, 4).map((c) => <MiniCar key={c._id} car={c} />)}
            {data.cars.length === 0 && <div className="state">لا توجد سيارات بعد</div>}
          </div>
        </div>
        <aside className="ov-ledger">
          <div className="panel-head"><h2 style={{ fontSize: 15 }}>آخر الحركات</h2><Link className="more" href="/app/ledger">الدفتر كامل</Link></div>
          <div className="list">
            {data.recentTransactions.slice(0, 5).map((t) => {
              const lbl = txnLabel(t);
              const rowClass = t.type === "income" ? "in" : t.type === "withdrawal" ? "out" : "out";
              return (
                <div key={t._id} className={`row ${rowClass}`}>
                  <span className="dotic">{t.type === "income" ? "▲" : t.type === "withdrawal" ? "↧" : "▼"}</span>
                  <div className="info">
                    <div className="t1">{lbl.primary}</div>
                    <div className="t2">{timeAr(t.date)}{lbl.secondary ? ` · ${lbl.secondary}` : ""}</div>
                  </div>
                  <div className="amts"><div className="amt num">{t.type === "income" ? "+" : "−"}{money(t.amount)}</div></div>
                </div>
              );
            })}
            {data.recentTransactions.length === 0 && <div className="state">لا توجد حركات بعد</div>}
          </div>
        </aside>
      </div>
    </>
  );
}

function MiniCar({ car }: { car: Car }) {
  const paid = car.payoffPct >= 100;
  return (
    <Link href="/app/cars" className={`car ${paid ? "paid" : ""}`}>
      <div className="car-top">
        <CarThumb src={car.imageUrl} />
        <div className="car-name-wrap">
          <span className="car-name">{car.make} {car.model} {car.year}</span>
          <span className="plate num">{car.plate}</span>
        </div>
      </div>
      <div className="track"><div className="fill" style={{ width: `${Math.min(car.payoffPct, 100)}%` }} /></div>
      <div className="car-bot">
        {paid
          ? <span className="badge"><span className="tick"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></span>سدّدت ثمنها</span>
          : <span className="remain">متبقّي <b className="num">{money(car.remaining)}</b> د.ل</span>}
        <span className="pct num">{Math.round(car.payoffPct)}%</span>
      </div>
    </Link>
  );
}
