"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOpUI } from "@/components/operatorUi";
import { operator, ApiError } from "@/lib/api";
import type { OfficeRow } from "@/lib/types";

const STATUSES = [
  { v: "", label: "الكل" },
  { v: "trial", label: "تجربة" },
  { v: "active", label: "فعّال" },
  { v: "expired", label: "منتهي" },
  { v: "suspended", label: "معلّق" },
];
const STATUS_LABEL: Record<string, string> = { trial: "تجربة", active: "فعّال", expired: "منتهي" };

export default function OfficesPage() {
  const router = useRouter();
  const { refreshKey } = useOpUI();
  const [status, setStatus] = useState("");
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<OfficeRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const page = await operator.offices.list({ status: status || undefined, q: q || undefined, limit: 50 });
      setItems(page.items);
      setCursor(page.nextCursor);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر التحميل");
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function loadMore() {
    if (!cursor) return;
    const page = await operator.offices.list({ status: status || undefined, q: q || undefined, cursor, limit: 50 });
    setItems((p) => [...p, ...page.items]);
    setCursor(page.nextCursor);
  }

  return (
    <>
      <h1 className="op-h1">المكاتب</h1>

      <div className="toolbar">
        <div className="chips">
          {STATUSES.map((s) => (
            <button key={s.v} className={`chip-f ${status === s.v ? "on" : ""}`} onClick={() => setStatus(s.v)}>{s.label}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQ(term.trim()); }} style={{ display: "flex", gap: 8 }}>
          <input className="" placeholder="بحث بالاسم أو الهاتف" value={term} onChange={(e) => setTerm(e.target.value)}
            style={{ height: 40, border: "1px solid var(--line)", borderRadius: 10, padding: "0 12px", fontFamily: "inherit", fontWeight: 600 }} />
          <button className="btn brand" type="submit">بحث</button>
        </form>
      </div>

      {loading && items.length === 0 && <div className="state"><div className="spinner" />جارٍ التحميل…</div>}
      {err && <div className="state">{err}</div>}

      <div className="list">
        {items.map((o) => {
          const st = o.subscription.suspended ? "suspended" : o.subscription.status;
          return (
            <div key={o._id} className="tblrow" onClick={() => router.push(`/console/offices/${o._id}`)}>
              <div className="grow">
                <div className="n">{o.name}</div>
                <div className="s">{o.city ? `${o.city} · ` : ""}<span className="num">{o.phone}</span>{o.lastActiveAt ? ` · آخر نشاط ${new Date(o.lastActiveAt).toLocaleDateString("ar")}` : ""}</div>
              </div>
              <span className={`tag ${st}`}>{o.subscription.suspended ? "معلّق" : STATUS_LABEL[o.subscription.status]}</span>
              <span className="chev"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg></span>
            </div>
          );
        })}
        {items.length === 0 && !loading && <div className="state">لا توجد مكاتب</div>}
        {cursor && <div style={{ textAlign: "center", padding: 14 }}><button className="linkbtn" onClick={loadMore}>تحميل المزيد</button></div>}
      </div>
    </>
  );
}
