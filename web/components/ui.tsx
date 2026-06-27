"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";
import TxnModal from "./TxnModal";
import CarModal from "./CarModal";
import CustomerModal from "./CustomerModal";
import type { Car } from "@/lib/types";

export interface ToastOpts { undo?: () => unknown; }
type ModalState =
  | null
  | { kind: "txn"; mode: "in" | "out" }
  | { kind: "car"; car?: Car }
  | { kind: "customer" };

interface UIValue {
  openTxn: (mode: "in" | "out") => void;
  openCar: (car?: Car) => void;
  openCustomer: () => void;
  toast: (msg: string, opts?: ToastOpts) => void;
  bump: () => void;          // signal "data changed" → pages refetch
  refreshKey: number;
}

const Ctx = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const undoRef = useRef<(() => unknown) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);
  const close = useCallback(() => setModal(null), []);

  const toast = useCallback((msg: string, opts?: ToastOpts) => {
    undoRef.current = opts?.undo ?? null;
    setToastMsg(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const onUndo = useCallback(async () => {
    const fn = undoRef.current;
    setToastMsg(null);
    undoRef.current = null;
    if (!fn) return;
    try { await fn(); } finally { bump(); }
  }, [bump]);

  const value: UIValue = {
    openTxn: (mode) => setModal({ kind: "txn", mode }),
    openCar: (car) => setModal({ kind: "car", car }),
    openCustomer: () => setModal({ kind: "customer" }),
    toast,
    bump,
    refreshKey,
  };

  const done = (msg: string, opts?: ToastOpts) => { close(); bump(); toast(msg, opts); };

  return (
    <Ctx.Provider value={value}>
      {children}

      {modal?.kind === "txn" && <TxnModal mode={modal.mode} onClose={close} done={done} />}
      {modal?.kind === "car" && <CarModal car={modal.car} onClose={close} done={done} />}
      {modal?.kind === "customer" && <CustomerModal onClose={close} done={done} />}

      {toastMsg && (
        <div className="toast show">
          <span>{toastMsg}</span>
          {undoRef.current && <span className="u" onClick={onUndo}>تراجع</span>}
        </div>
      )}
    </Ctx.Provider>
  );
}

export type DoneFn = (msg: string, opts?: ToastOpts) => void;

export function useUI(): UIValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUI must be used within UIProvider");
  return v;
}
