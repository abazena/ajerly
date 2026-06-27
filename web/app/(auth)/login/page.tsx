"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tenant, setToken, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await tenant.login({ phone: phone.trim(), password });
      setToken("tenant", r.token);
      router.replace("/app");
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.code === "INVALID_CREDENTIALS" ? "رقم الهاتف أو كلمة المرور غير صحيحة" : e.message)
        : "تعذّر تسجيل الدخول");
      setBusy(false);
    }
  }

  return (
    <div className="authpage">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">أجرلي<span>.</span></div>
        <div className="auth-sub">سجّل الدخول إلى مكتبك</div>
        {err && <div className="err">{err}</div>}
        <div className="field"><label>رقم الهاتف</label>
          <input inputMode="tel" autoFocus value={phone} placeholder="091-234-5678" onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="field"><label>كلمة المرور</label>
          <input type="password" value={password} placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="save brand block" disabled={busy} type="submit">دخول</button>
        <div className="auth-foot">ليس لديك حساب؟ <Link className="linkbtn" href="/signup">ابدأ تجربة مجانية</Link></div>
      </form>
    </div>
  );
}
