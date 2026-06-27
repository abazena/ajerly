"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { tenant, getToken, clearToken, ApiError } from "./api";
import type { TenantUser, Office } from "./types";

type Status = "loading" | "anon" | "authed";

interface AuthValue {
  status: Status;
  user: TenantUser | null;
  office: Office | null;
  readonly: boolean; // subscription expired or suspended → block writes
  reload: () => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

export function TenantAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<TenantUser | null>(null);
  const [office, setOffice] = useState<Office | null>(null);

  const reload = useCallback(async () => {
    if (!getToken("tenant")) {
      setStatus("anon");
      return;
    }
    try {
      const me = await tenant.me();
      setUser(me.user);
      setOffice(me.office);
      setStatus("authed");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.code === "NETWORK")) {
        if (e.status === 401) clearToken("tenant");
        setStatus("anon");
      } else {
        setStatus("anon");
      }
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const logout = useCallback(() => {
    clearToken("tenant");
    setUser(null);
    setOffice(null);
    setStatus("anon");
    router.replace("/login");
  }, [router]);

  const sub = office?.subscription;
  const readonly = !!sub && (sub.suspended || sub.status === "expired");

  return (
    <Ctx.Provider value={{ status, user, office, readonly, reload, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within TenantAuthProvider");
  return v;
}
