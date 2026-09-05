import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { applyPendingUpdate } from "@/pwa/registerSW";
import { cn } from "@/lib/utils";

/**
 * Shows a small "Update available" toast in the top-right when the service
 * worker has a new build ready. Clicking Update triggers a controlled
 * skipWaiting + reload via vite-plugin-pwa.
 */
export function ServiceWorkerUpdatePrompt() {
  const [show, setShow] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener("sw:update-available", handler);
    return () => window.removeEventListener("sw:update-available", handler);
  }, []);

  if (!show) return null;

  const handleUpdate = async () => {
    setUpdating(true);
    await applyPendingUpdate();
  };

  return (
    <div
      role="alertdialog"
      aria-label="App update available"
      className={cn(
        "fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-white/10 px-4 py-3 max-w-sm",
      )}
    >
      <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold">New version available</p>
        <p className="text-white/70 text-xs">Refresh to get the latest improvements.</p>
      </div>
      <button
        type="button"
        onClick={handleUpdate}
        disabled={updating}
        className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs px-3 py-1.5 disabled:opacity-60"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", updating && "animate-spin")} />
        {updating ? "Updating…" : "Update"}
      </button>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="text-white/50 hover:text-white text-xs ml-1"
        aria-label="Dismiss"
      >
        Later
      </button>
    </div>
  );
}

export default ServiceWorkerUpdatePrompt;
