// Offline queue with flush-on-reconnect and pub/sub for UI badges.
// Submissions and reminders are executed against Supabase Edge Functions;
// analytics events are buffered and sent via a lightweight beacon.

import { supabase } from "@/integrations/supabase/client";
import {
  idbAdd,
  idbAll,
  idbClear,
  idbCount,
  idbDelete,
  idbUpdate,
  type QueueKind,
  type QueuedRecord,
} from "./db";

export type { QueueKind, QueuedRecord } from "./db";

export interface SubmissionPayload {
  fn: string; // edge function name
  body: unknown;
  label?: string; // shown in banner ("Booking", "Quote", ...)
}

export interface ReminderPayload {
  fn: string;
  body: unknown;
  label?: string;
}

export interface AnalyticsPayload {
  event: string;
  props?: Record<string, unknown>;
  ts: number;
}

type Listener = (counts: QueueCounts) => void;
export interface QueueCounts {
  submissions: number;
  reminders: number;
  analytics: number;
  total: number;
}

const listeners = new Set<Listener>();
let flushing = false;

async function readCounts(): Promise<QueueCounts> {
  const [s, r, a] = await Promise.all([
    idbCount("submissions"),
    idbCount("reminders"),
    idbCount("analytics"),
  ]);
  return { submissions: s, reminders: r, analytics: a, total: s + r + a };
}

async function notify() {
  const counts = await readCounts().catch(() => ({ submissions: 0, reminders: 0, analytics: 0, total: 0 }));
  listeners.forEach((l) => l(counts));
}

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener);
  void notify();
  return () => listeners.delete(listener);
}

export async function queueSubmission(payload: SubmissionPayload): Promise<number> {
  const id = await idbAdd("submissions", payload);
  void notify();
  return id;
}

export async function queueReminder(payload: ReminderPayload): Promise<number> {
  const id = await idbAdd("reminders", payload);
  void notify();
  return id;
}

export async function queueAnalytics(event: string, props?: Record<string, unknown>): Promise<void> {
  try {
    await idbAdd("analytics", { event, props, ts: Date.now() } satisfies AnalyticsPayload);
    void notify();
  } catch {
    // analytics is best-effort
  }
}

async function runOne(store: QueueKind, rec: QueuedRecord<any>): Promise<boolean> {
  try {
    if (store === "submissions" || store === "reminders") {
      const p = rec.payload as SubmissionPayload | ReminderPayload;
      const { error } = await supabase.functions.invoke(p.fn, { body: p.body });
      if (error) throw new Error(error.message || "invoke failed");
    } else if (store === "analytics") {
      // Analytics buffering: just log for now — projects can wire this to
      // a real sink (edge function or PostHog) without touching UI code.
      // Keeping side-effect free avoids surprise network churn on reconnect.
      const p = rec.payload as AnalyticsPayload;
      if (typeof console !== "undefined") console.debug("[analytics:flush]", p.event, p.props);
    }
    if (rec.id != null) await idbDelete(store, rec.id);
    return true;
  } catch (err: any) {
    rec.attempts = (rec.attempts || 0) + 1;
    rec.lastError = err?.message || String(err);
    // Drop after 10 failed attempts so a poisoned payload can't block flush forever.
    if (rec.attempts >= 10 && rec.id != null) {
      await idbDelete(store, rec.id);
    } else {
      await idbUpdate(store, rec);
    }
    return false;
  }
}

export async function flushQueue(): Promise<QueueCounts> {
  if (flushing || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return readCounts();
  }
  flushing = true;
  try {
    for (const store of ["submissions", "reminders", "analytics"] as QueueKind[]) {
      const items = await idbAll<any>(store);
      for (const rec of items) {
        const ok = await runOne(store, rec);
        if (!ok) break; // stop this store on first failure to preserve order
      }
    }
  } finally {
    flushing = false;
    void notify();
  }
  return readCounts();
}

export async function listQueue(store: QueueKind): Promise<QueuedRecord<any>[]> {
  return idbAll(store);
}

export async function clearQueue(store: QueueKind): Promise<void> {
  await idbClear(store);
  void notify();
}

export async function removeQueueItem(store: QueueKind, id: number): Promise<void> {
  await idbDelete(store, id);
  void notify();
}

let installed = false;
export function installOfflineAutoFlush() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("online", () => void flushQueue());
  // Periodic retry (every 60s) covers cases where 'online' doesn't fire.
  setInterval(() => {
    if (navigator.onLine) void flushQueue();
  }, 60_000);
  // First-load flush attempt.
  if (navigator.onLine) void flushQueue();
}
