"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tenant, operator, setToken, ApiError } from "@/lib/api";

// Unified login. Email → operator flow; anything else → tenant flow.
export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isEmail = identifier.includes("@");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (isEmail) {
        const r = await operator.login({ email: identifier.trim(), password });
        setToken("operator", r.token);
        router.replace("/console");
      } else {
        const r = await tenant.login({ phone: identifier.trim(), password });
        setToken("tenant", r.token);
        router.replace("/app");
      }
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.code === "INVALID_CREDENTIALS"
            ? "رقم الهاتف/البريد أو كلمة المرور غير صحيحة"
            : e.message)
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
        <div className="field"><label>رقم الهاتف أو البريد الإلكتروني</label>
          <input
            inputMode={isEmail ? "email" : "tel"}
            autoFocus
            value={identifier}
            placeholder="091-234-5678"
            onChange={(e) => setIdentifier(e.target.value)}
            style={isEmail ? { direction: "ltr" } : undefined}
          /></div>
        <div className="field"><label>كلمة المرور</label>
          <input type="password" value={password} placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="save brand block" disabled={busy} type="submit">دخول</button>
        <div className="auth-foot">ليس لديك حساب؟ <Link className="linkbtn" href="/signup">ابدأ تجربة مجانية</Link></div>
      </form>
    </div>
  );
}
