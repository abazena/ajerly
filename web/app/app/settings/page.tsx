"use client";
import { useEffect, useState } from "react";
import { useUI } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/useData";
import { tenant, ApiError } from "@/lib/api";
import { dateFull } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = { trial: "تجربة مجانية", active: "اشتراك فعّال", expired: "منتهي" };

type Tab = "subscription" | "profile" | "office";
const TAB_LABEL: Record<Tab, string> = {
  subscription: "الاشتراك",
  profile: "بياناتي",
  office: "المكتب",
};

export default function SettingsPage() {
  const ui = useUI();
  const { user, office, reload: reloadAuth, logout } = useAuth();
  const { data: sub, reload } = useData(() => tenant.subscription.get(), [ui.refreshKey]);
  const target = sub?.expiresAt ?? sub?.trialEndsAt;
  const [tab, setTab] = useState<Tab>("subscription");

  return (
    <div className="settings-tabs">
      <nav className="settings-nav" role="tablist">
        {(["subscription", "profile", "office"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t}
            className={`settings-nav-btn ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>

      <div className="settings-panel">
        {tab === "subscription" && (
          <div className="settings-stack">
            <section className="card settings-card">
              <h2>الاشتراك</h2>
              {sub ? (
                <dl className="kv">
                  <div className="kv-row">
                    <dt>الحالة</dt>
                    <dd>
                      <span className={`tag ${sub.status}`}>{STATUS_LABEL[sub.status] ?? sub.status}</span>
                      {sub.suspended && <span className="tag suspended" style={{ marginInlineStart: 6 }}>معلّق</span>}
                    </dd>
                  </div>
                  {target && (
                    <div className="kv-row">
                      <dt>{sub.status === "expired" ? "انتهى في" : "ينتهي في"}</dt>
                      <dd>{dateFull(target)}</dd>
                    </div>
                  )}
                  {sub.daysRemaining != null && sub.status !== "expired" && (
                    <div className="kv-row">
                      <dt>المتبقّي</dt>
                      <dd><b className="num">{sub.daysRemaining}</b> يوم</dd>
                    </div>
                  )}
                </dl>
              ) : <p className="settings-meta">جارٍ التحميل…</p>}
            </section>
            <RedeemVoucher onRedeemed={() => Promise.all([reload(), reloadAuth()])} />
          </div>
        )}

        {tab === "profile" && user && (
          <UserProfileForm
            initialName={user.name}
            initialPhone={user.phone ?? ""}
            onSaved={reloadAuth}
          />
        )}

        {tab === "office" && office && (
          <OfficeForm
            initialName={office.name}
            initialCity={office.city ?? ""}
            onSaved={reloadAuth}
            onLogout={logout}
          />
        )}
      </div>
    </div>
  );
}

function RedeemVoucher({ onRedeemed }: { onRedeemed: () => Promise<unknown> }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function redeem() {
    if (!code.trim()) { setErr("ألصق رمز القسيمة"); return; }
    setErr(null); setOk(null); setBusy(true);
    try {
      await tenant.subscription.redeem(code.trim());
      setOk("تم تفعيل الاشتراك بنجاح ✓");
      setCode("");
      await onRedeemed();
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.code === "VOUCHER_NOT_FOUND" ? "رمز غير صحيح"
          : e.code === "VOUCHER_ALREADY_REDEEMED" ? "تم استخدام هذا الرمز من قبل"
          : e.message)
        : "تعذّر التفعيل");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card settings-card">
      <h2>تفعيل / تجديد الاشتراك</h2>
      {err && <div className="err">{err}</div>}
      {ok && <div className="ok">{ok}</div>}
      <div className="field">
        <label>رمز القسيمة</label>
        <input type="text" placeholder="XXXX-XXXX-XXXX" value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ direction: "ltr", textAlign: "center", letterSpacing: 1 }} />
      </div>
      <button className="save brand" disabled={busy} onClick={redeem}>تفعيل الاشتراك</button>
      <p className="hint">احصل على قسيمة من المشغّل، ثم ألصق الرمز هنا لتمديد اشتراكك.</p>
    </section>
  );
}

function UserProfileForm({ initialName, initialPhone, onSaved }: {
  initialName: string; initialPhone: string; onSaved: () => Promise<unknown>;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setName(initialName); setPhone(initialPhone); }, [initialName, initialPhone]);

  const dirty = name !== initialName || phone !== initialPhone || newPassword.length > 0;

  async function save() {
    setErr(null); setOk(null);
    if (newPassword && newPassword.length < 8) { setErr("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"); return; }
    if (newPassword && !currentPassword) { setErr("أدخل كلمة المرور الحالية للتغيير"); return; }
    setBusy(true);
    try {
      const body: Record<string, string> = {};
      if (name !== initialName) body.name = name.trim();
      if (phone !== initialPhone) body.phone = phone.trim();
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }
      await tenant.updateMe(body);
      await onSaved();
      setCurrent(""); setNew("");
      setOk("تم حفظ التعديلات ✓");
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.code === "INVALID_CURRENT_PASSWORD" ? "كلمة المرور الحالية غير صحيحة"
          : e.code === "USER_PHONE_TAKEN" ? "رقم الهاتف مستخدم بالفعل"
          : e.message)
        : "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card settings-card">
      <h2>بياناتي</h2>
      {err && <div className="err">{err}</div>}
      {ok && <div className="ok">{ok}</div>}
      <div className="field"><label>الاسم</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field"><label>رقم الهاتف</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ direction: "ltr", textAlign: "right" }} />
      </div>
      <p className="settings-meta" style={{ margin: "6px 0 10px" }}>اترك حقلَي كلمة المرور فارغين إذا لم تكن تريد تغييرها.</p>
      <div className="field"><label>كلمة المرور الحالية</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="field"><label>كلمة المرور الجديدة</label>
        <input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} placeholder="8 أحرف على الأقل" />
      </div>
      <button className="save brand" disabled={busy || !dirty} onClick={save}>حفظ التعديلات</button>
    </section>
  );
}

function OfficeForm({ initialName, initialCity, onSaved, onLogout }: {
  initialName: string; initialCity: string; onSaved: () => Promise<unknown>; onLogout: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setName(initialName); setCity(initialCity); }, [initialName, initialCity]);

  const dirty = name !== initialName || city !== initialCity;

  async function save() {
    setErr(null); setOk(null);
    setBusy(true);
    try {
      const body: Record<string, string> = {};
      if (name !== initialName) body.name = name.trim();
      if (city !== initialCity) body.city = city.trim();
      await tenant.updateOffice(body);
      await onSaved();
      setOk("تم حفظ التعديلات ✓");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card settings-card">
      <h2>المكتب</h2>
      {err && <div className="err">{err}</div>}
      {ok && <div className="ok">{ok}</div>}
      <div className="field"><label>اسم المكتب</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field"><label>المدينة</label>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="اختياري" />
      </div>
      <button className="save brand" disabled={busy || !dirty} onClick={save}>حفظ التعديلات</button>
      <button className="btn expense" onClick={onLogout} style={{ marginTop: 18, width: "100%", justifyContent: "center" }}>
        تسجيل الخروج
      </button>
    </section>
  );
}
