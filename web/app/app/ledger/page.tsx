"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { useUI } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { tenant, ApiError } from "@/lib/api";
import { money, timeAr, groupByDay, toMinor, dateShort } from "@/lib/format";
import EmptyCTA from "@/components/EmptyCTA";
import type { Transaction } from "@/lib/types";

type Kind = "all" | "income" | "expense" | "withdrawal";

const KIND_LABEL: Record<Kind, string> = {
  all: "الكل",
  income: "دخل",
  expense: "مصروف",
  withdrawal: "إخراج",
};

const PAGE_SIZE = 50;

// YYYY-MM-DD for <input type="date">, using LOCAL time.
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayYmd(): string { return ymd(new Date()); }
function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return ymd(d);
}

// ISO at LOCAL midnight (start) or next-day midnight (exclusive end), so the
// server's date range matches what the user picked in their timezone.
function toIsoStart(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}
function toIsoEndExclusive(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d + 1, 0, 0, 0, 0).toISOString();
}

export default function LedgerPage() {
  const ui = useUI();
  const { readonly } = useAuth();
  const [kind, setKind] = useState<Kind>("all");
  const [from, setFrom] = useState<string>(defaultFrom());
  const [to, setTo] = useState<string>(todayYmd());

  // Cursor stack lets us walk back through previous pages without server changes:
  // each entry is the cursor used to fetch that page (null = first page).
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [pageIdx, setPageIdx] = useState(0);
  const [items, setItems] = useState<Transaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cash, setCash] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const cur = cursorStack[pageIdx];
      const [dash, page] = await Promise.all([
        tenant.dashboard(),
        tenant.ledger({
          type: kind,
          limit: PAGE_SIZE,
          ...(cur ? { cursor: cur } : {}),
          ...(from ? { from: toIsoStart(from) } : {}),
          ...(to ? { to: toIsoEndExclusive(to) } : {}),
        }),
      ]);
      setCash(dash.cashBalance);
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر التحميل");
    } finally {
      setLoading(false);
    }
  }, [kind, from, to, cursorStack, pageIdx]);

  useEffect(() => { load(); }, [load, ui.refreshKey]);

  // Reset pagination when filters change. This effect intentionally watches
  // only the filters (not the cursor stack itself) to avoid a feedback loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCursorStack([null]); setPageIdx(0); }, [kind, from, to]);

  function goNext() {
    if (!nextCursor) return;
    setCursorStack((s) => {
      const trimmed = s.slice(0, pageIdx + 1);
      return [...trimmed, nextCursor];
    });
    setPageIdx((i) => i + 1);
  }
  function goPrev() {
    if (pageIdx === 0) return;
    setPageIdx((i) => i - 1);
  }

  const totals = useMemo(() => {
    let inc = 0, exp = 0, wd = 0;
    for (const t of items) {
      if (t.type === "income") inc += t.amount;
      else if (t.type === "expense") exp += t.amount;
      else if (t.type === "withdrawal") wd += t.amount;
    }
    return { inc, exp, wd };
  }, [items]);

  // Running balance only when no kind filter — otherwise the math diverges.
  // We can't anchor "newest=cash" anymore once we're paginated, so just hide
  // the per-row balance on pages > 1 (it's not meaningful there).
  const running: Record<string, number> = {};
  if (kind === "all" && pageIdx === 0) {
    let bal = cash;
    for (const t of items) {
      running[t._id] = bal;
      bal += t.type === "income" ? -t.amount : t.amount;
    }
  }

  const groups = groupByDay(items, (t) => t.date);
  const hasNext = !!nextCursor;
  const hasPrev = pageIdx > 0;

  return (
    <>
      <div className="strip strip-4">
        <div className="mini">
          <div className="k">الرصيد الحالي</div>
          <div className="v"><span className="num">{money(cash)}</span><span className="unit">د.ل</span></div>
          <div className="k-sub">الآن</div>
        </div>
        <div className="mini good">
          <div className="k">الدخل</div>
          <div className="v"><span className="num">{money(totals.inc)}</span><span className="unit">د.ل</span></div>
          <div className="k-sub">من <b>{dateShort(from)}</b> إلى <b>{dateShort(to)}</b></div>
        </div>
        <div className="mini bad">
          <div className="k">المصاريف</div>
          <div className="v"><span className="num">{money(totals.exp)}</span><span className="unit">د.ل</span></div>
          <div className="k-sub">من <b>{dateShort(from)}</b> إلى <b>{dateShort(to)}</b></div>
        </div>
        <div className="mini">
          <div className="k">المسحوب</div>
          <div className="v"><span className="num">{money(totals.wd)}</span><span className="unit">د.ل</span></div>
          <div className="k-sub">من <b>{dateShort(from)}</b> إلى <b>{dateShort(to)}</b></div>
        </div>
      </div>

      <div className="ledger-toolbar">
        <div className="daterange">
          <label>من
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>إلى
            <input type="date" value={to} min={from || undefined} max={todayYmd()} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button className="linkbtn" type="button" onClick={() => { setFrom(defaultFrom()); setTo(todayYmd()); }}>إعادة ضبط</button>
        </div>

        <div className="chips">
          {(["all", "income", "expense", "withdrawal"] as Kind[]).map((f) => (
            <button key={f} className={`chip-f ${kind === f ? "on" : ""}`} onClick={() => setKind(f)}>
              {KIND_LABEL[f]}
            </button>
          ))}
        </div>

        {!readonly && (
          <div className="ledger-actions">
            <button className="btn expense" onClick={() => setWithdrawOpen(true)}>
              <span className="pm">↧</span>إخراج نقدية
            </button>
            <button className="btn income" onClick={() => ui.openTxn("in")}>
              <span className="pm">+</span>حركة جديدة
            </button>
          </div>
        )}
      </div>

      {loading && items.length === 0 && <div className="state"><div className="spinner" />جارٍ التحميل…</div>}
      {err && <div className="state">{err}</div>}

      {!loading || items.length > 0 ? (
        <div className="list">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="lgroup">{g.heading}</div>
              {g.items.map((t) => <LedgerRow key={t._id} t={t} balance={kind === "all" && pageIdx === 0 ? running[t._id] : undefined} />)}
            </div>
          ))}
          {items.length === 0 && !loading && (
            kind === "all" && pageIdx === 0 && !readonly ? (
              <EmptyCTA
                icon={<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z" /><path d="M8 7h6M8 11h6M8 15h3" /></svg>}
                title="لا توجد حركات في هذه الفترة"
                body="سجّل أول حركة دخل أو مصروف لتبدأ بتتبّع نقدية المكتب."
                cta="تسجيل دخل"
                onClick={() => ui.openTxn("in")}
              />
            ) : (
              <div className="state">لا توجد حركات في هذه الفترة</div>
            )
          )}
        </div>
      ) : null}

      {/* Pagination always rendered when we have ≥1 page or can go forward */}
      {(hasPrev || hasNext) && (
        <div className="pager">
          <button className="linkbtn" disabled={!hasPrev || loading} onClick={goPrev}>← السابق</button>
          <span className="pager-idx">صفحة <b className="num">{pageIdx + 1}</b></span>
          <button className="linkbtn" disabled={!hasNext || loading} onClick={goNext}>التالي →</button>
        </div>
      )}

      {withdrawOpen && (
        <WithdrawModal currentCash={cash} onClose={() => setWithdrawOpen(false)}
          done={(msg, undo) => { setWithdrawOpen(false); ui.bump(); ui.toast(msg, undo ? { undo } : undefined); }} />
      )}
    </>
  );
}

function LedgerRow({ t, balance }: { t: Transaction; balance?: number }) {
  const cls = t.type === "income" ? "in" : t.type === "withdrawal" ? "wd" : "out";
  const sign = t.type === "income" ? "+" : "−";
  const icon = t.type === "income" ? "▲" : t.type === "withdrawal" ? "↧" : "▼";
  const label = t.note || (t.type === "income" ? "دخل" : t.type === "withdrawal" ? "إخراج نقدية" : "مصروف");
  return (
    <div className={`row ${cls}`}>
      <span className="dotic">{icon}</span>
      <div className="info">
        <div className="t1">{label}</div>
        <div className="t2">{timeAr(t.date)}</div>
      </div>
      <div className="amts">
        <div className="amt num">{sign}{money(t.amount)}</div>
        {balance !== undefined && <div className="bal num">الرصيد {money(balance)}</div>}
      </div>
    </div>
  );
}

function WithdrawModal({ currentCash, onClose, done }: {
  currentCash: number;
  onClose: () => void;
  done: (msg: string, undo?: () => Promise<unknown>) => void;
}) {
  const [amount, setAmount] = useState(currentCash > 0 ? String(currentCash / 1000) : "");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const major = parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(major) || major <= 0) { setErr("أدخل مبلغاً صحيحاً"); return; }
    const amt = toMinor(major);
    if (amt > currentCash) { setErr(`المبلغ يتجاوز النقدية المتوفرة (${money(currentCash)} د.ل)`); return; }
    setErr(null);
    setBusy(true);
    try {
      const r = await tenant.transactions.create({
        type: "withdrawal",
        amount: amt,
        ...(note ? { note } : {}),
      });
      const txnId = (r as { _id: string })._id;
      done("تم إخراج النقدية ✓", () => tenant.transactions.remove(txnId));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر الحفظ");
      setBusy(false);
    }
  }

  return (
    <Modal title="إخراج نقدية" onClose={onClose}>
      {err && <div className="err">{err}</div>}
      <p className="hint" style={{ marginTop: 0 }}>
        تسجيل خروج مبلغ نقدي من المكتب (مثل تفريغ الصندوق في نهاية اليوم). لا يُحتسب كمصروف تشغيلي.
      </p>
      <div className="field amount-wrap">
        <label>المبلغ</label><span className="cur">د.ل</span>
        <input type="text" inputMode="decimal" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} />
      </div>
      <p className="hint">
        النقدية الحالية: <b className="num">{money(currentCash)}</b> د.ل
      </p>
      <div className="field"><label>ملاحظة (اختياري)</label>
        <input type="text" placeholder="مثال: تفريغ نهاية اليوم" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button className="save out" disabled={busy} onClick={save}>تسجيل الإخراج</button>
    </Modal>
  );
}
