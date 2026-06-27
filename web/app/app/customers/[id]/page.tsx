"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { useUI } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/useData";
import { tenant, ApiError } from "@/lib/api";
import { money, toMinor, timeAr } from "@/lib/format";
import type { Car } from "@/lib/types";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ui = useUI();
  const { readonly } = useAuth();
  const { data, error, loading, reload } = useData(() => tenant.customers.statement(id), [id, ui.refreshKey]);
  const [form, setForm] = useState<null | "charge" | "payment">(null);

  // Fetch cars once for both the picker and statement-row badges.
  const { data: carsData } = useData(() => tenant.cars.list(), [ui.refreshKey]);
  const carById = useMemo(() => {
    const m = new Map<string, Car>();
    for (const c of carsData?.cars ?? []) m.set(c._id, c);
    return m;
  }, [carsData]);

  if (loading && !data) return <div className="state"><div className="spinner" />جارٍ التحميل…</div>;
  if (error) return <div className="state">{error}</div>;
  if (!data) return null;

  return (
    <>
      <Link href="/app/customers" className="back"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>كل العملاء</Link>

      <div className="co-hero">
        <div className="l">
          <div className="n">{data.customer.name}</div>
          <div className="bal"><div className="k">إجمالي الدين المستحق</div><div className="v"><span className="num">{money(data.customer.balance)}</span><span className="unit">د.ل</span></div></div>
        </div>
        {!readonly && (
          <div className="r">
            <button className="btn ghost" onClick={() => setForm("charge")}><span className="pm">+</span>إيجار آجل</button>
            <button className="btn lite" onClick={() => setForm("payment")}><span className="pm">+</span>دفعة</button>
          </div>
        )}
      </div>

      <div className="panel-head"><h2>كشف الحساب</h2></div>
      <div className="list">
        {data.rows.map((r) => {
          const car = r.carId ? carById.get(r.carId) : null;
          return (
            <div key={r._id} className={`row ${r.kind === "charge" ? "charge" : "pay"}`}>
              <span className="dotic">{r.kind === "charge" ? "+" : "−"}</span>
              <div className="info">
                <div className="t1">
                  <span className={`st-tag ${r.kind === "charge" ? "charge" : "pay"}`}>{r.kind === "charge" ? "إيجار آجل" : "دفعة"}</span>
                  {car ? `${car.make} ${car.model}` : (r.note || (r.kind === "charge" ? "إيجار" : "دفعة نقدية"))}
                </div>
                <div className="t2">{timeAr(r.date)}{car && r.note ? ` · ${r.note}` : ""}</div>
              </div>
              <div className="amts"><div className="amt num">{r.kind === "charge" ? "+" : "−"}{money(r.amount)}</div><div className="bal num">الرصيد {money(r.runningBalance)}</div></div>
            </div>
          );
        })}
        {data.rows.length === 0 && <div className="state">لا توجد حركات على هذا العميل بعد</div>}
      </div>

      {form && (
        <EntryForm kind={form} customerId={id} cars={carsData?.cars ?? null} onClose={() => setForm(null)}
          done={(msg, undo) => { setForm(null); ui.bump(); reload(); ui.toast(msg, undo ? { undo } : undefined); }} />
      )}
    </>
  );
}

function EntryForm({ kind, customerId, cars, onClose, done }: {
  kind: "charge" | "payment";
  customerId: string;
  cars: Car[] | null;
  onClose: () => void;
  done: (msg: string, undo?: () => Promise<unknown>) => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [carId, setCarId] = useState<string | null>(null);
  const [carQuery, setCarQuery] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Mirror TxnModal's search behaviour: filter as you type but always keep the
  // currently selected car visible so it can't slip out of view mid-edit.
  const visibleCars = useMemo(() => {
    if (!cars) return null;
    const q = carQuery.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) =>
      c._id === carId || `${c.make} ${c.model} ${c.year} ${c.plate}`.toLowerCase().includes(q)
    );
  }, [cars, carQuery, carId]);

  // Auto-clear search input when a car is picked, so the chip grid restores to full view.
  useEffect(() => { if (carId) setCarQuery(""); }, [carId]);

  async function save() {
    const major = parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(major) || major <= 0) { setErr("أدخل مبلغاً صحيحاً"); return; }
    setErr(null);
    setBusy(true);
    try {
      const amt = toMinor(major);
      const body = {
        customerId,
        amount: amt,
        ...(carId ? { carId } : {}),
        ...(note ? { note } : {}),
      };
      if (kind === "charge") {
        const r = await tenant.ledgerEntries.charge(body);
        const eid = (r.entry as { _id: string })._id;
        done("تم تسجيل الإيجار الآجل ✓", () => tenant.ledgerEntries.remove(eid));
      } else {
        const r = await tenant.ledgerEntries.payment(body);
        done("تم تسجيل الدفعة ✓", () => tenant.ledgerEntries.remove(r.ledgerEntryId));
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر الحفظ");
      setBusy(false);
    }
  }

  return (
    <Modal title={kind === "charge" ? "تسجيل إيجار آجل" : "تسجيل دفعة"} onClose={onClose}>
      {err && <div className="err">{err}</div>}
      <div className="field amount-wrap">
        <label>المبلغ</label><span className="cur">د.ل</span>
        <input type="text" inputMode="decimal" placeholder="0" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="field">
        <label>السيارة (اختياري)</label>
        {cars && cars.length > 0 && (
          <input
            type="search"
            placeholder="بحث بالاسم أو اللوحة"
            value={carQuery}
            onChange={(e) => setCarQuery(e.target.value)}
            style={{ marginBottom: 10 }}
          />
        )}
        <div className="pick">
          {cars === null && <span className="state" style={{ padding: 8 }}>...</span>}
          {visibleCars?.map((c) => (
            <div key={c._id} className={`c ${carId === c._id ? "sel" : ""}`}
              onClick={() => setCarId(carId === c._id ? null : c._id)}>
              {c.make} {c.model}<small>{c.plate}</small>
            </div>
          ))}
          {cars?.length === 0 && <span className="hint">لا توجد سيارات بعد</span>}
          {cars && cars.length > 0 && visibleCars?.length === 0 && (
            <span className="hint">لا توجد نتائج لهذا البحث</span>
          )}
        </div>
      </div>
      <div className="field"><label>ملاحظة (اختياري)</label>
        <input type="text" placeholder={kind === "charge" ? "مثال: 3 أيام" : "مثال: دفعة جزئية"} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button className={`save ${kind === "charge" ? "brand" : "in"}`} disabled={busy} onClick={save}>{kind === "charge" ? "تسجيل الإيجار" : "تسجيل الدفعة"}</button>
    </Modal>
  );
}
