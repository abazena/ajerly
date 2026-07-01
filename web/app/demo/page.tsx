"use client";
import Link from "next/link";

// Non-interactive preview of the tenant dashboard. Reuses the app's own CSS
// classes with hardcoded values. No auth, no API, no state — signup lives in
// the top banner and the CTAs there.

const CARS = [
  { name: "تويوتا كورولا 2018", plate: "5 · 42178", pct: 65, remaining: 3000 },
  { name: "تويوتا يارس 2020",   plate: "7 · 88231", pct: 100, remaining: 0 },
  { name: "هيونداي إلنترا 2019", plate: "3 · 19940", pct: 42, remaining: 5400 },
  { name: "كيا ريو 2021",       plate: "2 · 70513", pct: 86, remaining: 1200 },
];

const RECENT: Array<{ type: "in" | "out"; primary: string; time: string; amt: number }> = [
  { type: "in",  primary: "دفعة من شركة النور",      time: "اليوم ١١:٢٠ ص", amt: 2000 },
  { type: "in",  primary: "إيجار كورولا، ٣ أيام",     time: "اليوم ٩:٤٥ ص",  amt: 1500 },
  { type: "out", primary: "صيانة نيسان صني",         time: "اليوم ٨:١٠ ص",  amt: 400  },
  { type: "in",  primary: "إيجار إلنترا، يومان",      time: "أمس ٦:٣٠ م",    amt: 800  },
  { type: "in",  primary: "إيجار ريو، يوم واحد",      time: "أمس ٢:١٥ م",    amt: 250  },
];

export default function DemoPage() {
  return (
    <div className="shell">
      <aside className="side">
        <div>
          <div className="logo"><img src="/logos/ajerly-ver-logo.png" alt="أجرلي" /></div>
          <div className="office">مكتب الواحة لتأجير السيارات</div>
          <div className="username">أحمد المحمود</div>
        </div>
        <nav className="nav">
          <a className="on"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>نظرة عامة</a>
          <a><svg viewBox="0 0 24 24"><path d="M5 17h14M6.5 17l1-5.5a2 2 0 0 1 2-1.6h5a2 2 0 0 1 2 1.6l1 5.5"/><path d="M5 17v2M19 17v2"/></svg>السيارات</a>
          <a><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13"/><path d="M9 21v-5h6v5"/></svg>العملاء</a>
          <a><svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z"/><path d="M8 7h6M8 11h6M8 15h3"/></svg>الدفتر</a>
        </nav>
        <div className="side-foot">
          <nav className="nav">
            <Link href="/signup" className="soon" style={{ color: "var(--brand)", fontWeight: 700 }}>
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              ابدأ حساباً مجانياً
            </Link>
          </nav>
        </div>
      </aside>

      <main className="main">
        <div className="mtop"><div className="mt-title">نظرة عامة</div></div>
        <div className="top">
          <div><h1>نظرة عامة</h1><div className="date">الأحد، ٢٨ يونيو ٢٠٢٦</div></div>
          <div className="actions">
            <button className="btn expense"><span className="pm">−</span>تسجيل مصروف</button>
            <button className="btn income"><span className="pm">+</span>تسجيل دخل</button>
          </div>
        </div>

        <div className="banner">
          <span><b>هذه معاينة.</b> البيانات تجريبية لعرض التطبيق فقط.</span>
          <Link href="/signup">ابدأ حساباً مجانياً ←</Link>
        </div>

        <div className="hero-row">
          <div className="card cash">
            <div className="hero-mtop">
              <div className="logo2">أجرلي<span>.</span></div>
            </div>
            <div><div className="k">النقدية المتوفرة</div><div className="v"><span className="big num">12,400</span><span className="unit">د.ل</span></div></div>
            <div className="today">
              <div className="pill in"><span className="ar">▲</span><span className="num">1,500</span><span className="t">دخل اليوم</span></div>
              <div className="pill out"><span className="ar">▼</span><span className="num">400</span><span className="t">مصروف اليوم</span></div>
            </div>
          </div>

          <div className="card stat debt ov-stat">
            <div className="head"><span className="k">العملاء مدينون لك</span><span className="ic"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13"/><path d="M9 21v-6h6v6"/></svg></span></div>
            <div><div className="v"><span className="num">3,200</span><span className="unit">د.ل</span></div><div className="sub">إجمالي المستحقات عليهم</div></div>
          </div>

          <div className="card stat fleet ov-stat">
            <div className="head"><span className="k">أسطول السيارات</span><span className="ic"><svg viewBox="0 0 24 24"><path d="M5 17h14M6.5 17l1-5.5a2 2 0 0 1 2-1.6h5a2 2 0 0 1 2 1.6l1 5.5"/></svg></span></div>
            <div><div className="v"><span className="num">4</span><span className="unit">سيارات</span></div><div className="sub"><b className="num">1</b> سدّدت ثمنها بالكامل</div></div>
          </div>
        </div>

        <div className="split">
          <div>
            <div className="panel-head"><h2>السيارات</h2><a className="more">عرض الكل ←</a></div>
            <div className="cars-grid">
              {CARS.map((c) => (
                <div key={c.plate} className={`car ${c.pct >= 100 ? "paid" : ""}`}>
                  <div className="car-top">
                    <span className="car-name">{c.name}</span>
                    <span className="plate num">{c.plate}</span>
                  </div>
                  <div className="track"><div className="fill" style={{ width: `${c.pct}%` }} /></div>
                  <div className="car-bot">
                    {c.pct >= 100
                      ? <span className="badge"><span className="tick"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>سدّدت ثمنها</span>
                      : <span className="remain">متبقّي <b className="num">{c.remaining.toLocaleString()}</b> د.ل</span>}
                    <span className="pct num">{c.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="ov-ledger">
            <div className="panel-head"><h2 style={{ fontSize: 15 }}>آخر الحركات</h2><a className="more">الدفتر كامل</a></div>
            <div className="list">
              {RECENT.map((r, i) => (
                <div key={i} className={`row ${r.type}`}>
                  <span className="dotic">{r.type === "in" ? "▲" : "▼"}</span>
                  <div className="info"><div className="t1">{r.primary}</div><div className="t2">{r.time}</div></div>
                  <div className="amts"><div className="amt num">{r.type === "in" ? "+" : "−"}{r.amt.toLocaleString()}</div></div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      <nav className="bottomnav">
        <a className="bn on"><svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>الرئيسية</a>
        <a className="bn"><svg viewBox="0 0 24 24"><path d="M5 17h14M6.5 17l1-5.5a2 2 0 0 1 2-1.6h5a2 2 0 0 1 2 1.6l1 5.5"/></svg>السيارات</a>
        <Link href="/signup" className="bn-fab" aria-label="ابدأ مجاناً"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></Link>
        <a className="bn"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13"/></svg>العملاء</a>
        <a className="bn"><svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z"/><path d="M8 7h6M8 11h6"/></svg>الدفتر</a>
      </nav>
    </div>
  );
}
