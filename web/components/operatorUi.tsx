"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";

interface OpUIValue {
  toast: (msg: string) => void;
  bump: () => void;
  refreshKey: number;
}
const Ctx = createContext<OpUIValue | null>(null);

export function OperatorUIProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2800);
  }, []);
  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <Ctx.Provider value={{ toast, bump, refreshKey }}>
      {children}
      {msg && <div className="toast show"><span>{msg}</span></div>}
    </Ctx.Provider>
  );
}

export function useOpUI(): OpUIValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOpUI must be used within OperatorUIProvider");
  return v;
}
