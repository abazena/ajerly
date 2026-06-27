"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { operator, setToken, ApiError } from "@/lib/api";
import { useOperator } from "@/lib/operatorAuth";

export default function OperatorLoginPage() {
  const router = useRouter();
  const auth = useOperator();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await operator.login({ email: email.trim(), password });
      setToken("operator", r.token);
      // Refresh the auth context (it sits above this page in the layout and
      // doesn't remount on navigation) before going to /console.
      await auth.reload();
      router.replace("/console");
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.code === "INVALID_CREDENTIALS" ? "البريد أو كلمة المرور غير صحيحة" : e.message)
        : "تعذّر تسجيل الدخول");
      setBusy(false);
    }
  }

  return (
    <div className="authpage">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">أجرلي<span>.</span></div>
        <div className="auth-sub">كونسول المشغّل</div>
        {err && <div className="err">{err}</div>}
        <div className="field"><label>البريد الإلكتروني</label>
          <input type="email" autoFocus value={email} placeholder="operator@ajer.ly" onChange={(e) => setEmail(e.target.value)} style={{ direction: "ltr" }} /></div>
        <div className="field"><label>كلمة المرور</label>
          <input type="password" value={password} placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="save brand block" disabled={busy} type="submit">دخول</button>
      </form>
    </div>
  );
}
