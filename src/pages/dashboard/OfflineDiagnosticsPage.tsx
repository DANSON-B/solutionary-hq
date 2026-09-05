import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, Trash2, Database, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  clearQueue,
  flushQueue,
  listQueue,
  removeQueueItem,
  subscribeQueue,
  type QueueCounts,
  type QueueKind,
  type QueuedRecord,
} from "@/lib/offline/queue";
import { useToast } from "@/hooks/use-toast";

const STORES: { key: QueueKind; label: string; hint: string }[] = [
  { key: "submissions", label: "Queued Submissions", hint: "Booking / quote forms saved offline" },
  { key: "reminders", label: "Queued Reminders", hint: "Notifications waiting to be sent" },
  { key: "analytics", label: "Buffered Analytics", hint: "Events drained on reconnect" },
];

export default function OfflineDiagnosticsPage() {
  const online = useOnlineStatus();
  const { toast } = useToast();
  const [counts, setCounts] = useState<QueueCounts>({ submissions: 0, reminders: 0, analytics: 0, total: 0 });
  const [items, setItems] = useState<Record<QueueKind, QueuedRecord<any>[]>>({
    submissions: [],
    reminders: [],
    analytics: [],
  });
  const [flushing, setFlushing] = useState(false);

  const refresh = async () => {
    const [s, r, a] = await Promise.all([listQueue("submissions"), listQueue("reminders"), listQueue("analytics")]);
    setItems({ submissions: s, reminders: r, analytics: a });
  };

  useEffect(() => {
    const unsub = subscribeQueue((c) => {
      setCounts(c);
      void refresh();
    });
    void refresh();
    return unsub;
  }, []);

  const handleFlush = async () => {
    setFlushing(true);
    const after = await flushQueue();
    setFlushing(false);
    await refresh();
    toast({
      title: after.total === 0 ? "All caught up ✅" : `${after.total} item${after.total === 1 ? "" : "s"} still pending`,
      description: after.total === 0 ? "Every queued item was synced successfully." : "Some items failed — try again shortly.",
    });
  };

  const handleClear = async (store: QueueKind) => {
    if (!confirm(`Clear all ${store}? This cannot be undone.`)) return;
    await clearQueue(store);
    await refresh();
  };

  const handleRemove = async (store: QueueKind, id?: number) => {
    if (id == null) return;
    await removeQueueItem(store, id);
    await refresh();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <Helmet>
        <title>Offline Diagnostics — Solutionary HQ</title>
      </Helmet>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Offline Diagnostics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inspect, retry, or clear work saved while you were offline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={online ? "default" : "destructive"} className="gap-1.5">
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? "Online" : "Offline"}
          </Badge>
          <Button onClick={handleFlush} disabled={!online || flushing || counts.total === 0} size="sm">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${flushing ? "animate-spin" : ""}`} />
            {flushing ? "Syncing…" : "Retry sync"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STORES.map((s) => (
          <Card key={s.key}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="text-3xl font-bold mt-1">{counts[s.key]}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {STORES.map((store) => {
        const rows = items[store.key];
        return (
          <Card key={store.key}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{store.label}</CardTitle>
              {rows.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => handleClear(store.key)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Clear all
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2 py-6 justify-center">
                  <CloudOff className="h-4 w-4" />
                  Nothing queued.
                </div>
              ) : (
                <ul className="divide-y">
                  {rows.map((rec) => {
                    const label =
                      (rec.payload as any)?.label ||
                      (rec.payload as any)?.fn ||
                      (rec.payload as any)?.event ||
                      "Queued item";
                    return (
                      <li key={rec.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Queued {format(new Date(rec.createdAt), "MMM d, h:mm a")}</span>
                            {rec.attempts > 0 && (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                {rec.attempts} attempt{rec.attempts === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>
                          {rec.lastError && (
                            <div className="text-xs text-destructive mt-1 truncate">Error: {rec.lastError}</div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(store.key, rec.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
