import Link from "next/link";

const ANCHORS = [
  "كل ضغطتين، حركة في الدفتر",
  "كل سيارة بشريط تسديد",
  "كل شركة بكشف حساب",
];

const PLAN_FEATURES = [
  "١٤ يوم تجربة مجانية",
  "تثبيت على الجوال والحاسوب",
  "نسخ احتياطية يومية",
  "إلغاء متى شئت",
];

const FAQ = [
  {
    q: "كيف أبدأ؟",
    a: "أنشئ حساباً مجانياً في دقيقة، ثم سجّل سياراتك وأول حركاتك فوراً.",
  },
  {
    q: "كم تكلفة الاشتراك؟",
    a: "اشتراك شهري بسعر مبسّط، يُدفع عبر قسيمة تفعيل. بدون بطاقات ائتمان.",
  },
  {
    q: "ماذا يحدث بعد انتهاء التجربة؟",
    a: "تبقى بياناتك ظاهرة للقراءة فقط حتى تفعّل قسيمة لمواصلة التسجيل.",
  },
  {
    q: "هل بياناتي خاصة؟",
    a: "نعم. كل مكتب معزول تماماً، ولا أحد يطّلع على دفاترك المالية.",
  },
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function Landing() {
  return (
    <div className="land">
      <header className="land-nav">
        <div className="land-nav-inner">
          <Link href="/" className="land-logo" aria-label="أجرلي">
            <img src="/logos/ajerly-hor-logo.png" alt="أجرلي" />
          </Link>
          <div className="land-nav-actions">
            <Link className="lnk" href="/login">دخول</Link>
            <Link className="cta" href="/signup">ابدأ مجاناً</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="land-inner hero-grid">
          <div className="hero-copy">
            <h1>دفتر مكتبك، أخفّ وأذكى</h1>
            <p>
              أجرلي يستبدل دفتر مكتب تأجير السيارات. نقديتك، تسديد سياراتك، وديون
              شركاتك في مكان واحد.
            </p>
            <div className="hero-cta">
              <Link className="primary" href="/signup">ابدأ مجاناً</Link>
              <a className="secondary" href="#features">شاهد كيف يعمل</a>
            </div>
            <div className="hero-trust">
              تجربة مجانية ١٤ يوم. بدون بطاقة.
            </div>
          </div>

          <div className="hero-preview" aria-hidden="true">
            <div className="preview-stack">
              <div className="card cash">
                <div>
                  <div className="k">النقدية المتوفرة</div>
                  <div className="v">
                    <span className="big num">12,400</span>
                    <span className="unit">د.ل</span>
                  </div>
                </div>
                <div className="today">
                  <div className="pill in">
                    <span className="ar">▲</span>
                    <span className="num">1,500</span>
                    <span className="t">دخل اليوم</span>
                  </div>
                  <div className="pill out">
                    <span className="ar">▼</span>
                    <span className="num">400</span>
                    <span className="t">مصروف اليوم</span>
                  </div>
                </div>
              </div>

              <div className="car">
                <div className="car-top">
                  <span className="car-name">تويوتا كورولا 2018</span>
                  <span className="plate num">5 · 42178</span>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: "65%" }} />
                </div>
                <div className="car-bot">
                  <span className="remain">متبقّي <b className="num">3,000</b> د.ل</span>
                  <span className="pct num">65%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="anchors">
        <div className="anchors-inner">
          {ANCHORS.map((t) => (
            <div className="anchor" key={t}>
              <div className="t">{t}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="sec" id="features">
        <div className="land-inner">
          <h2>كل ما يهمّك من إدارة المكتب</h2>
          <p className="sec-lede">
            في صفحة واحدة. كل صباح تفتح أجرلي وتعرف أين وقفت، دون أن تقلّب
            أوراقاً.
          </p>

          <div className="bento">
            <div className="bento-cell cash-cell">
              <div>
                <h3>نقديتك المتوفرة</h3>
                <p>اعرف ما في صندوقك الآن، مع دخل ومصروف اليوم.</p>
              </div>
              <div className="demo" aria-hidden="true">
                <div className="card cash">
                  <div>
                    <div className="k">النقدية المتوفرة</div>
                    <div className="v">
                      <span className="big num">12,400</span>
                      <span className="unit">د.ل</span>
                    </div>
                  </div>
                  <div className="today">
                    <div className="pill in">
                      <span className="ar">▲</span>
                      <span className="num">1,500</span>
                    </div>
                    <div className="pill out">
                      <span className="ar">▼</span>
                      <span className="num">400</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-cell car-cell">
              <div>
                <h3>تسديد كل سيارة</h3>
                <p>شريط لكل سيارة يوضّح المسترد والمتبقّي من ثمنها.</p>
              </div>
              <div className="demo" aria-hidden="true">
                <div className="car">
                  <div className="car-top">
                    <span className="car-name">هيونداي إلنترا</span>
                    <span className="plate num">3 · 19940</span>
                  </div>
                  <div className="track">
                    <div className="fill" style={{ width: "42%" }} />
                  </div>
                  <div className="car-bot">
                    <span className="remain">متبقّي <b className="num">5,400</b> د.ل</span>
                    <span className="pct num">42%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-cell debt-cell">
              <div>
                <h3>ديون العملاء والشركات</h3>
                <p>من يدين لك وكم، مرتّبة بأكبر دين أولاً.</p>
              </div>
              <div className="demo" aria-hidden="true">
                <div className="co-row">
                  <div className="co-av">ن</div>
                  <div className="co-main">
                    <div className="n">شركة النور للمقاولات</div>
                    <div className="p num">091-234-5678</div>
                  </div>
                  <div className="co-bal">
                    <div className="lbl">مدينة لك بـ</div>
                    <div className="v">
                      <span className="num">1,400</span>
                      <span className="unit">د.ل</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-cell ledger-cell">
              <div>
                <h3>دفتر يومي مرتّب</h3>
                <p>كل حركة دخل ومصروف باليوم والساعة، مع الرصيد الجاري.</p>
              </div>
              <div className="demo" aria-hidden="true">
                <div className="list">
                  <div className="row in">
                    <span className="dotic">▲</span>
                    <div className="info">
                      <div className="t1">دفعة من شركة النور</div>
                      <div className="t2">اليوم ١١:٢٠ ص</div>
                    </div>
                    <div className="amts"><div className="amt num">+2,000</div></div>
                  </div>
                  <div className="row in">
                    <span className="dotic">▲</span>
                    <div className="info">
                      <div className="t1">إيجار كورولا، ٣ أيام</div>
                      <div className="t2">اليوم ٩:٤٥ ص</div>
                    </div>
                    <div className="amts"><div className="amt num">+1,500</div></div>
                  </div>
                  <div className="row out">
                    <span className="dotic">▼</span>
                    <div className="info">
                      <div className="t1">صيانة نيسان صني</div>
                      <div className="t2">اليوم ٨:١٠ ص</div>
                    </div>
                    <div className="amts"><div className="amt num">−400</div></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-cell entry-cell bento-entry">
              <div>
                <h3>تسجيل في ثانيتين</h3>
                <p>المبلغ، السيارة، تم. الدفتر يثقل، لا أنت.</p>
              </div>
              <div className="demo" aria-hidden="true">
                <div className="seg">
                  <button type="button" className="seg-b in on">دخل</button>
                  <button type="button" className="seg-b out">مصروف</button>
                </div>
                <div className="amount-wrap">
                  <span className="cur">د.ل</span>
                  <input type="text" defaultValue="1,500" readOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="pricing-inner">
          <div className="pricing-copy">
            <h2>تسعير صريح</h2>
            <p>
              بدون بطاقة. تفعّل اشتراكك بقسيمة من وكيلك أو من{" "}
              <a
                href="https://wa.me/218913984262"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--brand)", fontWeight: 700 }}
              >
                واتساب فريقنا
              </a>
              .
            </p>
            <ul>
              {PLAN_FEATURES.map((f) => (
                <li key={f}>
                  <CheckIcon />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="price-card">
            <div className="label">اشتراك شهري</div>
            <div className="amt">
              <span className="num">100</span>
              <span className="unit">د.ل / شهر</span>
            </div>
            <div className="trial">ابدأ اليوم، التفعيل يأتي لاحقاً.</div>
            <Link className="cta" href="/signup">ابدأ مجاناً</Link>
          </div>
        </div>
      </section>

      <section className="faq" id="faq">
        <h2>أسئلة شائعة</h2>
        {FAQ.map((f, i) => (
          <details key={f.q} open={i === 0}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <footer className="land-foot">
        <p>أجرلي. إدارة مكتب تأجير السيارات.</p>
        <p style={{ marginTop: 6 }}>
          تواصل معنا عبر{" "}
          <a href="https://wa.me/218913984262" target="_blank" rel="noreferrer">
            واتساب
          </a>
        </p>
      </footer>
    </div>
  );
}
