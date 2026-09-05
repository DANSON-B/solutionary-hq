import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { flushQueue, subscribeQueue, type QueueCounts } from "@/lib/offline/queue";
import { cn } from "@/lib/utils";

/**
 * Persistent status pill shown when the user is offline OR when there's
 * queued work waiting to sync. Hidden when online + no pending items.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const [counts, setCounts] = useState<QueueCounts>({ submissions: 0, reminders: 0, analytics: 0, total: 0 });
  const [flushing, setFlushing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => subscribeQueue(setCounts), []);

  useEffect(() => {
    if (online && counts.total === 0) return;
  }, [online, counts.total]);

  const pending = counts.submissions + counts.reminders;
  if (online && pending === 0 && !justSynced) return null;

  const handleRetry = async () => {
    setFlushing(true);
    const before = counts.total;
    const after = await flushQueue();
    setFlushing(false);
    if (before > 0 && after.total === 0) {
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    }
  };

  const state: "offline" | "syncing" | "pending" | "synced" = !online
    ? "offline"
    : flushing
      ? "syncing"
      : pending > 0
        ? "pending"
        : "synced";

  const style = {
    offline: "bg-amber-500 text-white",
    syncing: "bg-blue-600 text-white",
    pending: "bg-amber-500 text-white",
    synced: "bg-emerald-600 text-white",
  }[state];

  const Icon = state === "synced" ? CheckCircle2 : state === "syncing" ? RefreshCw : CloudOff;
  const label = state === "offline"
    ? pending > 0 ? `Offline — ${pending} item${pending === 1 ? "" : "s"} will sync when back online` : "You're offline — changes will be saved and synced when you reconnect"
    : state === "syncing"
      ? "Syncing…"
      : state === "pending"
        ? `${pending} item${pending === 1 ? "" : "s"} waiting to sync`
        : "All caught up";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium max-w-[92vw]",
        style,
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", state === "syncing" && "animate-spin")} />
      <span className="truncate">{label}</span>
      {online && pending > 0 && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={flushing}
          className="ml-2 rounded-full bg-white/20 hover:bg-white/30 px-2 py-0.5 text-xs disabled:opacity-60"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default OfflineBanner;
