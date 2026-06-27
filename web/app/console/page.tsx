"use client";
import { useOpUI } from "@/components/operatorUi";
import { useData } from "@/lib/useData";
import { operator } from "@/lib/api";
import { lyd } from "@/lib/format";

export default function OperatorDashboard() {
  const { refreshKey } = useOpUI();
  const { data, error, loading } = useData(() => operator.dashboard(), [refreshKey]);

  if (loading && !data) return <div className="state"><div className="spinner" />جارٍ التحميل…</div>;
  if (error) return <div className="state">{error}</div>;
  if (!data) return null;

  const revMax = Math.max(1, ...data.redemptionRevenueByMonth.map((m) => m.revenueLyd));
  const signMax = Math.max(1, ...data.signupsByDay.map((d) => d.signups));

  return (
    <>
      <h1 className="op-h1">لوحة التحكم</h1>

      <div className="kpi-grid">
        <Kpi k="الإيراد الشهري المتكرّر" v={lyd(data.activeMrr)} unit="د.ل" />
        <Kpi k="مكاتب فعّالة" v={String(data.officeCounts.active)} />
        <Kpi k="قيد التجربة" v={String(data.officeCounts.trial)} />
        <Kpi k="منتهية" v={String(data.officeCounts.expired)} bad />
      </div>

      <div className="kpi-grid">
        <Kpi k="قسائم غير مستخدمة" v={String(data.vouchers.unused)} />
        <Kpi k="قسائم مستخدمة" v={String(data.vouchers.redeemed)} />
        <Kpi k="قسائم ملغاة" v={String(data.vouchers.void)} />
        <Kpi k="تحويل التجربة → مدفوع" v={`${data.trialToPaidConversion.rate}%`} />
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="panel-head"><h2>إيراد التفعيل شهرياً (د.ل)</h2></div>
        {data.redemptionRevenueByMonth.length === 0 ? <div className="state">لا توجد بيانات بعد</div> : (
          <div className="bars">
            {data.redemptionRevenueByMonth.map((m) => (
              <div key={m.month} className="bar fill-brand" style={{ height: `${(m.revenueLyd / revMax) * 100}%` }} title={`${m.month}: ${lyd(m.revenueLyd)}`}>
                <span>{m.month.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="panel-head"><h2>التسجيلات الجديدة (٣٠ يوماً)</h2></div>
        {data.signupsByDay.length === 0 ? <div className="state">لا توجد تسجيلات بعد</div> : (
          <div className="bars">
            {data.signupsByDay.map((d) => (
              <div key={d.day} className="bar" style={{ height: `${(d.signups / signMax) * 100}%` }} title={`${d.day}: ${d.signups}`} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Kpi({ k, v, unit, bad }: { k: string; v: string; unit?: string; bad?: boolean }) {
  return (
    <div className={`mini ${bad ? "bad" : ""}`}>
      <div className="k">{k}</div>
      <div className="v"><span className="num">{v}</span>{unit && <span className="unit">{unit}</span>}</div>
    </div>
  );
}
