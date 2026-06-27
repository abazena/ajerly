"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { operator, getToken, clearToken, ApiError } from "./api";
import type { Operator } from "./types";

type Status = "loading" | "anon" | "authed";

interface OperatorAuthValue {
  status: Status;
  op: Operator | null;
  reload: () => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<OperatorAuthValue | null>(null);

export function OperatorAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [op, setOp] = useState<Operator | null>(null);

  const reload = useCallback(async () => {
    if (!getToken("operator")) { setStatus("anon"); return; }
    try {
      const me = await operator.me();
      setOp(me.operator);
      setStatus("authed");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) clearToken("operator");
      setStatus("anon");
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const logout = useCallback(() => {
    clearToken("operator");
    setOp(null);
    setStatus("anon");
    router.replace("/console/login");
  }, [router]);

  return <Ctx.Provider value={{ status, op, reload, logout }}>{children}</Ctx.Provider>;
}

export function useOperator(): OperatorAuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOperator must be used within OperatorAuthProvider");
  return v;
}
