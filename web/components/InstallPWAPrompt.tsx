"use client";
import { useEffect, useState } from "react";
import Modal from "./Modal";

const DISMISS_KEY = "ajerly:pwa-prompted";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// ponytail: native beforeinstallprompt for Chrome/Edge/Android; manual hint for iOS Safari.
// Fires once per device (localStorage), only after the user has at least one car
// and one transaction. Skipped when already installed (display-mode: standalone).
export default function InstallPWAPrompt({ ready }: { ready: boolean }) {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, [ready]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return dismiss();
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {}
    dismiss();
  };

  if (!show) return null;

  return (
    <Modal title="ثبّت أجرلي على جوالك" onClose={dismiss}>
      <p className="hint" style={{ margin: "0 0 16px" }}>
        افتح أجرلي بضغطة واحدة من شاشتك الرئيسية، يعمل بدون متصفّح وبسرعة أكبر.
      </p>

      {deferred && (
        <button type="button" className="save brand" onClick={install}>
          تثبيت التطبيق
        </button>
      )}

      {!deferred && isIOS && (
        <div className="hint" style={{ margin: 0 }}>
          من شريط Safari اضغط أيقونة المشاركة، ثم اختر <b>«إضافة إلى الشاشة الرئيسية»</b>.
        </div>
      )}

      {!deferred && !isIOS && (
        <div className="hint" style={{ margin: 0 }}>
          من قائمة المتصفّح اختر <b>«تثبيت التطبيق»</b> أو <b>«Add to Home screen»</b>.
        </div>
      )}

      <button
        type="button"
        className="linkbtn"
        style={{ display: "block", margin: "16px auto 0" }}
        onClick={dismiss}
      >
        ليس الآن
      </button>
    </Modal>
  );
}
