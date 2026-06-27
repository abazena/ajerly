"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import type { DoneFn } from "./ui";
import { tenant, ApiError } from "@/lib/api";
import { toMinor } from "@/lib/format";
import type { Car, Customer } from "@/lib/types";

// amount → pick car → save. "more" reveals آجل (charge to customer) + note.
export default function TxnModal({ mode: initial, onClose, done }: {
  mode: "in" | "out";
  onClose: () => void;
  done: DoneFn;
}) {
  const [mode, setMode] = useState<"in" | "out">(initial);
  const [amount, setAmount] = useState("");
  const [carId, setCarId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>("");
  const [note, setNote] = useState("");
  const [carQuery, setCarQuery] = useState("");
  const [more, setMore] = useState(false);
  const [cars, setCars] = useState<Car[] | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([tenant.cars.list(), tenant.customers.list()])
      .then(([c, k]) => { setCars(c.cars); setCustomers(k.customers); })
      .catch(() => setCars([]));
  }, []);

  // Always keep the selected car visible even if it doesn't match the search.
  const visibleCars = useMemo(() => {
    if (!cars) return null;
    const q = carQuery.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) =>
      c._id === carId || `${c.make} ${c.model} ${c.year} ${c.plate}`.toLowerCase().includes(q)
    );
  }, [cars, carQuery, carId]);

  const credit = mode === "in" && customerId !== ""; // آجل
  const title = mode === "in" ? "تسجيل دخل" : "تسجيل مصروف";
  const saveLabel = credit ? "حفظ كدين آجل" : mode === "in" ? "حفظ الدخل" : "حفظ المصروف";

  async function save() {
    const major = parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(major) || major <= 0) { setErr("أدخل مبلغاً صحيحاً"); return; }
    setErr(null);
    setBusy(true);
    try {
      const amt = toMinor(major);
      if (credit) {
        const r = await tenant.ledgerEntries.charge({ customerId, amount: amt, carId: carId ?? undefined, note: note || undefined });
        const id = (r.entry as { _id: string })._id;
        done("تم تسجيل الدين الآجل ✓", { undo: () => tenant.ledgerEntries.remove(id) });
      } else {
        const t = await tenant.transactions.create({
          type: mode === "in" ? "income" : "expense",
          amount: amt, carId: carId ?? undefined, note: note || undefined,
        });
        done("تم تسجيل الحركة ✓", { undo: () => tenant.transactions.remove(t._id) });
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر الحفظ");
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="seg">
        <button className={`seg-b in ${mode === "in" ? "on" : ""}`} onClick={() => setMode("in")}>دخل</button>
        <button className={`seg-b out ${mode === "out" ? "on" : ""}`} onClick={() => { setMode("out"); setCustomerId(""); }}>مصروف</button>
      </div>

      {err && <div className="err">{err}</div>}

      <div className="field amount-wrap">
        <label>المبلغ</label>
        <span className="cur">د.ل</span>
        <input type="text" inputMode="decimal" placeholder="0" value={amount}
          autoFocus onChange={(e) => setAmount(e.target.value)} />
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

      <span className="more-link" onClick={() => setMore((m) => !m)}>+ تفاصيل إضافية (اختياري)</span>
      {more && (
        <div className="extra show">
          {mode === "in" && (
            <div className="field">
              <label>تسجيل كدين على عميل (آجل)</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">بدون — دخل نقدي</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="field">
            <label>ملاحظة</label>
            <input type="text" placeholder="مثال: إيجار ٣ أيام" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      )}

      <button className={`save ${credit ? "brand" : mode}`} disabled={busy} onClick={save}>{saveLabel}</button>
    </Modal>
  );
}
