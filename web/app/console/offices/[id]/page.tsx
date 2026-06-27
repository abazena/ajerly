"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useOpUI } from "@/components/operatorUi";
import { useData } from "@/lib/useData";
import { operator, ApiError } from "@/lib/api";
import { lyd } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = { trial: "تجربة", active: "فعّال", expired: "منتهي" };

export default function OfficeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast, bump, refreshKey } = useOpUI();
  const { data, error, loading, reload } = useData(() => operator.offices.get(id), [id, refreshKey]);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try { await fn(); toast(msg); bump(); reload(); }
    catch (e) { toast(e instanceof ApiError ? e.message : "تعذّر التنفيذ"); }
    finally { setBusy(false); }
  }

  if (loading && !data) return <div className="state"><div className="spinner" />جارٍ التحميل…</div>;
  if (error) return <div className="state">{error}</div>;
  if (!data) return null;

  const st = data.subscription.suspended ? "suspended" : data.subscription.status;

  return (
    <>
      <Link href="/console/offices" className="back"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>كل المكاتب</Link>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="op-h1" style={{ marginBottom: 4 }}>{data.name}</h1>
            <div className="s" style={{ color: "var(--faint)", fontWeight: 600 }}>{data.city ? `${data.city} · ` : ""}<span className="num">{data.phone}</span></div>
          </div>
          <span className={`tag ${st}`}>{data.subscription.suspended ? "معلّق" : STATUS_LABEL[data.subscription.status]}</span>
        </div>
        <div className="strip" style={{ marginTop: 18, marginBottom: 0 }}>
          <div className="mini"><div className="k">السيارات</div><div className="v"><span className="num">{data.carCount}</span></div></div>
          <div className="mini"><div className="k">المستخدمون</div><div className="v"><span className="num">{data.userCount}</span></div></div>
          <div className="mini"><div className="k">{data.subscription.expiresAt ? "ينتهي" : "تنتهي التجربة"}</div><div className="v" style={{ fontSize: 15 }}>{new Date(data.subscription.expiresAt ?? data.subscription.trialEndsAt).toLocaleDateString("ar")}</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="panel-head"><h2>إجراءات</h2></div>
        <div style={{ marginBottom: 8, color: "var(--muted)", fontWeight: 600, fontSize: 13 }}>تمديد الاشتراك:</div>
        <div className="chips" style={{ marginBottom: 16 }}>
          {[1, 3, 6, 12].map((m) => (
            <button key={m} className="chip-f" disabled={busy} onClick={() => run(() => operator.offices.extend(id, { months: m }), `تم التمديد ${m} أشهر ✓`)}>+{m} شهر</button>
          ))}
        </div>
        {data.subscription.suspended
          ? <button className="btn brand" disabled={busy} onClick={() => run(() => operator.offices.unsuspend(id), "تم رفع التعليق ✓")}>رفع التعليق</button>
          : <button className="btn expense" disabled={busy} onClick={() => run(() => operator.offices.suspend(id), "تم تعليق الحساب ✓")}>تعليق الحساب</button>}
      </div>

      <div className="card">
        <div className="panel-head"><h2>سجلّ التفعيلات</h2></div>
        <div className="list flush">
          {data.redemptions.map((r) => (
            <div key={r._id} className="tblrow" style={{ cursor: "default" }}>
              <div className="grow"><div className="n vcode">{r.code}</div><div className="s">{r.months} أشهر · {new Date(r.redeemedAt).toLocaleDateString("ar")}</div></div>
              {r.priceLyd != null && <span className="num" style={{ fontWeight: 800 }}>{lyd(r.priceLyd)} د.ل</span>}
            </div>
          ))}
          {data.redemptions.length === 0 && <div className="state">لا توجد تفعيلات بعد</div>}
        </div>
      </div>
    </>
  );
}
