"use client";
import { useState } from "react";
import Modal from "./Modal";
import type { DoneFn } from "./ui";
import { tenant, ApiError } from "@/lib/api";
import { toMinor, fromMinor } from "@/lib/format";
import type { Car } from "@/lib/types";

// Single modal for both add and edit. Pass `car` to edit it.
export default function CarModal({ car, onClose, done }: {
  car?: Car;
  onClose: () => void;
  done: DoneFn;
}) {
  const editing = !!car;
  const [make, setMake] = useState(car?.make ?? "");
  const [model, setModel] = useState(car?.model ?? "");
  const [year, setYear] = useState(car ? String(car.year) : "");
  const [plate, setPlate] = useState(car?.plate ?? "");
  const [cost, setCost] = useState(car ? String(fromMinor(car.purchaseCost)) : "");
  const [rate, setRate] = useState(car?.defaultDailyRate ? String(fromMinor(car.defaultDailyRate)) : "");
  const [more, setMore] = useState(!!car?.defaultDailyRate);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const y = parseInt(year, 10);
    const c = parseFloat(cost.replace(/,/g, ""));
    if (!make.trim() || !model.trim()) { setErr("أدخل الماركة والموديل"); return; }
    if (!Number.isInteger(y) || y < 1900 || y > 2100) { setErr("أدخل سنة صحيحة"); return; }
    if (!plate.trim()) { setErr("أدخل رقم اللوحة"); return; }
    if (!Number.isFinite(c) || c <= 0) { setErr("أدخل ثمن شراء صحيح"); return; }
    setErr(null);
    setBusy(true);
    try {
      const r = parseFloat(rate.replace(/,/g, ""));
      const body = {
        make: make.trim(), model: model.trim(), year: y, plate: plate.trim(),
        purchaseCost: toMinor(c),
        ...(Number.isFinite(r) && r > 0 ? { defaultDailyRate: toMinor(r) } : {}),
      };
      if (editing) {
        await tenant.cars.update(car!._id, body);
        done("تم حفظ التعديلات ✓");
      } else {
        const created = await tenant.cars.create(body);
        done("تمت إضافة السيارة ✓", { undo: () => tenant.cars.remove(created._id) });
      }
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.code === "CAR_PLATE_TAKEN" ? "رقم اللوحة مستخدم بالفعل" : e.message)
        : "تعذّر الحفظ");
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing) return;
    if (!confirm(`حذف ${car!.make} ${car!.model}؟ (لا يمكن التراجع)`)) return;
    setErr(null);
    setBusy(true);
    try {
      await tenant.cars.remove(car!._id);
      done("تم حذف السيارة ✓");
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.code === "CAR_HAS_TRANSACTIONS" ? "لا يمكن حذف السيارة لأن عليها حركات مسجّلة" : e.message)
        : "تعذّر الحذف");
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? "تعديل السيارة" : "إضافة سيارة"} onClose={onClose}>
      {err && <div className="err">{err}</div>}
      <div className="field-row">
        <div className="field"><label>الماركة</label><input value={make} placeholder="تويوتا" onChange={(e) => setMake(e.target.value)} /></div>
        <div className="field"><label>الموديل</label><input value={model} placeholder="كورولا" onChange={(e) => setModel(e.target.value)} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>السنة</label><input inputMode="numeric" value={year} placeholder="2018" onChange={(e) => setYear(e.target.value)} /></div>
        <div className="field"><label>رقم اللوحة</label><input value={plate} placeholder="5 · 42178" onChange={(e) => setPlate(e.target.value)} /></div>
      </div>
      <div className="field"><label>ثمن الشراء (د.ل)</label><input inputMode="decimal" value={cost} placeholder="8600" onChange={(e) => setCost(e.target.value)} /></div>
      <span className="more-link" onClick={() => setMore((m) => !m)}>+ سعر يومي افتراضي (اختياري)</span>
      {more && (
        <div className="extra show">
          <div className="field"><label>السعر اليومي (د.ل)</label><input inputMode="decimal" value={rate} placeholder="250" onChange={(e) => setRate(e.target.value)} /></div>
        </div>
      )}
      {!editing && <p className="hint">تظهر السيارة مباشرة في قائمتك وتبدأ بنسبة تسديد صفر.</p>}
      <button className="save brand" disabled={busy} onClick={save}>{editing ? "حفظ التعديلات" : "إضافة السيارة"}</button>
      {editing && (
        <button className="linkbtn" disabled={busy} onClick={remove}
          style={{ display: "block", margin: "14px auto 0", color: "var(--expense)" }}>
          حذف السيارة
        </button>
      )}
    </Modal>
  );
}
