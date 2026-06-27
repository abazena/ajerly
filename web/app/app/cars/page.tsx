"use client";
import { useMemo, useState } from "react";
import { useUI } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/useData";
import { tenant } from "@/lib/api";
import { money } from "@/lib/format";
import CarThumb from "@/components/CarThumb";
import EmptyCTA from "@/components/EmptyCTA";
import type { Car } from "@/lib/types";

type Filter = "all" | "owing" | "paid";

export default function CarsPage() {
  const ui = useUI();
  const { readonly } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const { data, error, loading } = useData(() => tenant.cars.list(filter), [filter, ui.refreshKey]);

  const cars = data?.cars ?? [];

  // Client-side search across make/model/year/plate. Loaded set is small (one
  // office's fleet), so server-side search isn't worth adding yet.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) =>
      `${c.make} ${c.model} ${c.year} ${c.plate}`.toLowerCase().includes(q)
    );
  }, [cars, query]);

  // Totals reflect the full filtered set (not narrowed by search) so numbers
  // stay meaningful as you type.
  const value = cars.reduce((s, c) => s + c.purchaseCost, 0);
  const remaining = cars.reduce((s, c) => s + c.remaining, 0);
  const recovered = value - remaining;

  return (
    <>
      <div className="strip">
        <div className="mini"><div className="k">قيمة الأسطول</div><div className="v"><span className="num">{money(value)}</span><span className="unit">د.ل</span></div></div>
        <div className="mini good"><div className="k">المسترد</div><div className="v"><span className="num">{money(recovered)}</span><span className="unit">د.ل</span></div></div>
        <div className="mini warn"><div className="k">المتبقّي</div><div className="v"><span className="num">{money(remaining)}</span><span className="unit">د.ل</span></div></div>
      </div>

      <div className="toolbar">
        <div className="chips">
          {(["all", "owing", "paid"] as Filter[]).map((f) => (
            <button key={f} className={`chip-f ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "الكل" : f === "owing" ? "متبقّي عليها" : "سدّدت ثمنها"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="بحث بالاسم أو اللوحة"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ height: 40, minWidth: 220, border: "1px solid var(--line)", borderRadius: 10, padding: "0 12px", fontFamily: "inherit", fontWeight: 500, background: "#fff" }}
          />
          {!readonly && <button className="btn brand" onClick={() => ui.openCar()}><span className="pm">+</span>إضافة سيارة</button>}
        </div>
      </div>

      {loading && !data && <div className="state"><div className="spinner" />جارٍ التحميل…</div>}
      {error && <div className="state">{error}</div>}
      {data && cars.length === 0 && filter === "all" && !query && !readonly && (
        <EmptyCTA
          icon={<svg viewBox="0 0 24 24"><path d="M5 17h14M6.5 17l1-5.5a2 2 0 0 1 2-1.6h5a2 2 0 0 1 2 1.6l1 5.5" /><path d="M5 17v2M19 17v2" /></svg>}
          title="لا توجد سيارات بعد"
          body="ابدأ بإضافة أول سيارة لتراها هنا مع شريط نسبة التسديد."
          cta="إضافة سيارة"
          onClick={() => ui.openCar()}
        />
      )}
      {data && !(cars.length === 0 && filter === "all" && !query) && (
        <div className="cars-grid grid-3">
          {visible.map((c) => (
            <CarCard key={c._id} car={c} onClick={readonly ? undefined : () => ui.openCar(c)} />
          ))}
          {visible.length === 0 && (
            <div className="state">{query ? "لا توجد نتائج لهذا البحث" : "لا توجد سيارات في هذا التصنيف"}</div>
          )}
        </div>
      )}
    </>
  );
}

function CarCard({ car, onClick }: { car: Car; onClick?: () => void }) {
  const paid = car.payoffPct >= 100;
  return (
    <div className={`car ${paid ? "paid" : ""}`} onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="car-top">
        <CarThumb src={car.imageUrl} />
        <div className="car-name-wrap">
          <span className="car-name">{car.make} {car.model} {car.year}</span>
          <span className="plate num">{car.plate}</span>
        </div>
      </div>
      <div className="car-detail"><span>الشراء <b className="num">{money(car.purchaseCost)}</b></span><span>الإيرادات <b className="num">{money(car.receivedIncome)}</b></span></div>
      <div className="track"><div className="fill" style={{ width: `${Math.min(car.payoffPct, 100)}%` }} /></div>
      <div className="car-bot">
        {paid
          ? <span className="badge"><span className="tick"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></span>سدّدت ثمنها</span>
          : <span className="remain">متبقّي <b className="num">{money(car.remaining)}</b> د.ل</span>}
        <span className="pct num">{Math.round(car.payoffPct)}%</span>
      </div>
    </div>
  );
}
