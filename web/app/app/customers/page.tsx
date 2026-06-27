"use client";
import Link from "next/link";
import { useUI } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/useData";
import { tenant } from "@/lib/api";
import { money, initials } from "@/lib/format";
import EmptyCTA from "@/components/EmptyCTA";

export default function CustomersPage() {
  const ui = useUI();
  const { readonly } = useAuth();
  const { data, error, loading } = useData(() => tenant.customers.list(), [ui.refreshKey]);

  const customers = data?.customers ?? [];
  const owing = customers.filter((c) => c.balance > 0);
  const totalDebt = owing.reduce((s, c) => s + c.balance, 0);
  const maxDebt = owing.reduce((m, c) => Math.max(m, c.balance), 0);

  return (
    <>
      <div className="strip">
        <div className="mini warn"><div className="k">إجمالي الديون</div><div className="v"><span className="num">{money(totalDebt)}</span><span className="unit">د.ل</span></div></div>
        <div className="mini"><div className="k">عدد العملاء</div><div className="v"><span className="num">{customers.length}</span></div></div>
        <div className="mini"><div className="k">أكبر دين</div><div className="v"><span className="num">{money(maxDebt)}</span><span className="unit">د.ل</span></div></div>
      </div>

      <div className="toolbar">
        <div />
        {!readonly && <button className="btn brand" onClick={ui.openCustomer}><span className="pm">+</span>إضافة عميل</button>}
      </div>

      {loading && !data && <div className="state"><div className="spinner" />جارٍ التحميل…</div>}
      {error && <div className="state">{error}</div>}
      {data && (
        <div className="co-list">
          {customers.map((c) => (
            <Link key={c._id} href={`/app/customers/${c._id}`} className="co-row">
              <div className="co-av">{initials(c.name)}</div>
              <div className="co-main">
                <div className="n">{c.name} <span className={`tag ${c.kind === "company" ? "active" : "unused"}`}>{c.kind === "company" ? "شركة" : "فرد"}</span></div>
                <div className="p num">{c.phone}</div>
              </div>
              <div className="co-bal"><div className="lbl">{c.balance > 0 ? "مدين لك بـ" : "الرصيد"}</div><div className="v"><span className="num">{money(c.balance)}</span><span className="unit">د.ل</span></div></div>
              <span className="chev"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg></span>
            </Link>
          ))}
          {customers.length === 0 && !readonly && (
            <EmptyCTA
              icon={<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>}
              title="لا يوجد عملاء بعد"
              body="أضف عميلاً عندما تحتاج لتتبع إيجار آجل أو دفعات لاحقة."
              cta="إضافة عميل"
              onClick={ui.openCustomer}
            />
          )}
          {customers.length === 0 && readonly && <div className="state">لا يوجد عملاء بعد</div>}
        </div>
      )}
    </>
  );
}
