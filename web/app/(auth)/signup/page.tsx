"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { publicApi, setToken, ApiError } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [f, setF] = useState({ officeName: "", ownerName: "", phone: "", password: "", city: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.password.length < 8) { setErr("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
    setErr(null);
    setBusy(true);
    try {
      const r = await publicApi.signup({
        officeName: f.officeName.trim(), ownerName: f.ownerName.trim(),
        phone: f.phone.trim(), password: f.password, city: f.city.trim() || undefined,
      });
      setToken("tenant", r.token);
      router.replace("/app");
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.code === "OFFICE_PHONE_TAKEN" ? "رقم الهاتف مستخدم بالفعل" : e.message)
        : "تعذّر إنشاء الحساب");
      setBusy(false);
    }
  }

  return (
    <div className="authpage">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">أجرلي<span>.</span></div>
        <div className="auth-sub">ابدأ تجربتك المجانية، 14 يوماً</div>
        {err && <div className="err">{err}</div>}
        <div className="field"><label>اسم المكتب</label>
          <input autoFocus value={f.officeName} placeholder="مكتب الواحة لتأجير السيارات" onChange={set("officeName")} /></div>
        <div className="field"><label>اسمك</label>
          <input value={f.ownerName} placeholder="محمد علي" onChange={set("ownerName")} /></div>
        <div className="field-row">
          <div className="field"><label>رقم الهاتف</label>
            <input inputMode="tel" value={f.phone} placeholder="091-234-5678" onChange={set("phone")} /></div>
          <div className="field"><label>المدينة (اختياري)</label>
            <input value={f.city} placeholder="طرابلس" onChange={set("city")} /></div>
        </div>
        <div className="field"><label>كلمة المرور</label>
          <input type="password" value={f.password} placeholder="8 أحرف على الأقل" onChange={set("password")} /></div>
        <button className="save brand block" disabled={busy} type="submit">إنشاء الحساب والبدء</button>
        <div className="auth-foot">لديك حساب؟ <Link className="linkbtn" href="/login">تسجيل الدخول</Link></div>
      </form>
    </div>
  );
}
