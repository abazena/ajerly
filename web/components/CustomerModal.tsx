"use client";
import { useState } from "react";
import Modal from "./Modal";
import type { DoneFn } from "./ui";
import { tenant, ApiError } from "@/lib/api";
import type { CustomerKind } from "@/lib/types";

export default function CustomerModal({ onClose, done }: { onClose: () => void; done: DoneFn }) {
  const [kind, setKind] = useState<CustomerKind>("company");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [more, setMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) { setErr("أدخل الاسم"); return; }
    if (!phone.trim()) { setErr("أدخل رقم الهاتف"); return; }
    setErr(null);
    setBusy(true);
    try {
      await tenant.customers.create({
        kind, name: name.trim(), phone: phone.trim(),
        ...(idNumber.trim() ? { idNumber: idNumber.trim() } : {}),
      });
      // No customer delete endpoint → no undo.
      done(kind === "company" ? "تمت إضافة الشركة ✓" : "تمت إضافة العميل ✓");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر الحفظ");
      setBusy(false);
    }
  }

  return (
    <Modal title="إضافة عميل" onClose={onClose}>
      {err && <div className="err">{err}</div>}
      <div className="seg">
        <button className={`seg-b brand ${kind === "company" ? "on" : ""}`} onClick={() => setKind("company")}>شركة</button>
        <button className={`seg-b brand ${kind === "individual" ? "on" : ""}`} onClick={() => setKind("individual")}>فرد</button>
      </div>
      <div className="field"><label>{kind === "company" ? "اسم الشركة" : "الاسم"}</label>
        <input value={name} placeholder={kind === "company" ? "شركة النور للمقاولات" : "محمد علي"} onChange={(e) => setName(e.target.value)} /></div>
      <div className="field"><label>رقم الهاتف</label>
        <input inputMode="tel" value={phone} placeholder="091-234-5678" onChange={(e) => setPhone(e.target.value)} /></div>
      <span className="more-link" onClick={() => setMore((m) => !m)}>+ رقم الهوية / الرخصة (اختياري)</span>
      {more && (
        <div className="extra show">
          <div className="field"><label>رقم الهوية أو الرخصة</label><input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} /></div>
        </div>
      )}
      <p className="hint">يبدأ العميل برصيد دين صفر، ثم تُسجّل عليه الإيجارات الآجلة والدفعات.</p>
      <button className="save brand" disabled={busy} onClick={save}>إضافة</button>
    </Modal>
  );
}
