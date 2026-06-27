"use client";
import { useCallback, useEffect, useState } from "react";
import { useOpUI } from "@/components/operatorUi";
import { operator, ApiError } from "@/lib/api";
import { lyd } from "@/lib/format";
import type { Voucher } from "@/lib/types";

const STATUSES = [
  { v: "", label: "الكل" },
  { v: "unused", label: "غير مستخدمة" },
  { v: "redeemed", label: "مستخدمة" },
  { v: "void", label: "ملغاة" },
];
const STATUS_LABEL: Record<string, string> = { unused: "غير مستخدمة", redeemed: "مستخدمة", void: "ملغاة" };

export default function VouchersPage() {
  const { toast, bump, refreshKey } = useOpUI();
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<Voucher[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // generate form
  const [qty, setQty] = useState("10");
  const [months, setMonths] = useState<1 | 3 | 6 | 12>(1);
  const [price, setPrice] = useState("");
  const [gBusy, setGBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const page = await operator.vouchers.list({ status: status || undefined, limit: 50 });
      setItems(page.items);
      setCursor(page.nextCursor);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر التحميل");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function loadMore() {
    if (!cursor) return;
    const page = await operator.vouchers.list({ status: status || undefined, cursor, limit: 50 });
    setItems((p) => [...p, ...page.items]);
    setCursor(page.nextCursor);
  }

  async function generate() {
    const n = parseInt(qty, 10);
    if (!Number.isInteger(n) || n < 1 || n > 1000) { toast("الكمية بين 1 و 1000"); return; }
    setGBusy(true);
    try {
      const p = parseInt(price, 10);
      await operator.vouchers.batch({ quantity: n, months, ...(Number.isInteger(p) && p >= 0 ? { priceLyd: p } : {}) });
      toast(`تم إنشاء ${n} قسيمة ✓`);
      bump();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "تعذّر الإنشاء");
    } finally {
      setGBusy(false);
    }
  }

  async function copy(text: string, msg: string) {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch { toast("تعذّر النسخ"); }
  }

  return (
    <>
      <h1 className="op-h1">القسائم</h1>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="panel-head"><h2>إنشاء دفعة قسائم</h2></div>
        <div className="field-row">
          <div className="field"><label>الكمية</label><input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          <div className="field"><label>المدة</label>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value) as 1 | 3 | 6 | 12)}>
              <option value={1}>شهر</option><option value={3}>٣ أشهر</option><option value={6}>٦ أشهر</option><option value={12}>١٢ شهراً</option>
            </select>
          </div>
        </div>
        <div className="field"><label>السعر لكل قسيمة (د.ل، اختياري)</label><input inputMode="numeric" value={price} placeholder="100" onChange={(e) => setPrice(e.target.value)} /></div>
        <button className="save brand" disabled={gBusy} onClick={generate}>إنشاء القسائم</button>
      </div>

      <div className="toolbar">
        <div className="chips">
          {STATUSES.map((s) => <button key={s.v} className={`chip-f ${status === s.v ? "on" : ""}`} onClick={() => setStatus(s.v)}>{s.label}</button>)}
        </div>
        {items.length > 0 && <button className="btn expense" onClick={() => copy(items.map((v) => v.code).join("\n"), "تم نسخ كل الرموز ✓")}>تصدير (نسخ الكل)</button>}
      </div>

      {loading && items.length === 0 && <div className="state"><div className="spinner" />جارٍ التحميل…</div>}
      {err && <div className="state">{err}</div>}

      <div className="list">
        {items.map((v) => (
          <div key={v._id} className="tblrow" style={{ cursor: "default" }}>
            <div className="grow">
              <div className="n vcode" onClick={() => copy(v.code, "تم نسخ الرمز ✓")} style={{ cursor: "pointer" }}>{v.code}</div>
              <div className="s">{v.months} أشهر{v.priceLyd != null ? ` · ${lyd(v.priceLyd)} د.ل` : ""}</div>
            </div>
            <span className={`tag ${v.status}`}>{STATUS_LABEL[v.status]}</span>
            {v.status === "unused" && <button className="linkbtn" style={{ color: "var(--expense)" }} onClick={async () => { try { await operator.vouchers.void(v._id); toast("تم الإلغاء ✓"); bump(); } catch (e) { toast(e instanceof ApiError ? e.message : "تعذّر الإلغاء"); } }}>إلغاء</button>}
          </div>
        ))}
        {items.length === 0 && !loading && <div className="state">لا توجد قسائم</div>}
        {cursor && <div style={{ textAlign: "center", padding: 14 }}><button className="linkbtn" onClick={loadMore}>تحميل المزيد</button></div>}
      </div>
    </>
  );
}
