// Automated offline tests: exercise the IndexedDB-backed queue in a fake-idb
// environment. Uses vi.mock to stub Supabase invoke so runOne succeeds/fails
// deterministically and drains queued items on flush.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";

const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

async function freshQueue() {
  vi.resetModules();
  // Wipe the fake IndexedDB between tests to avoid cross-test pollution.
  const { indexedDB } = await import("fake-indexeddb");
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("solhq-offline");
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
  return await import("@/lib/offline/queue");
}

beforeEach(() => {
  invokeMock.mockReset();
  // Default: pretend we're online so flushQueue actually runs.
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("offline queue", () => {
  it("stores submissions and reports counts", async () => {
    const q = await freshQueue();
    await q.queueSubmission({ fn: "public-submit-instaquote", body: { a: 1 }, label: "Quote" });
    await q.queueAnalytics("test.event", { foo: "bar" });
    const rows = await q.listQueue("submissions");
    const analytics = await q.listQueue("analytics");
    expect(rows).toHaveLength(1);
    expect(rows[0].payload).toMatchObject({ fn: "public-submit-instaquote", label: "Quote" });
    expect(analytics).toHaveLength(1);
  });

  it("drains submissions on flush when invoke succeeds", async () => {
    invokeMock.mockResolvedValue({ data: {}, error: null });
    const q = await freshQueue();
    await q.queueSubmission({ fn: "public-submit-instaquote", body: {}, label: "Q1" });
    await q.queueSubmission({ fn: "public-submit-instaquote", body: {}, label: "Q2" });
    const after = await q.flushQueue();
    expect(invokeMock).toHaveBeenCalledTimes(2);
    expect(after.submissions).toBe(0);
    expect(await q.listQueue("submissions")).toHaveLength(0);
  });

  it("keeps failed items and increments attempts", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const q = await freshQueue();
    await q.queueSubmission({ fn: "public-submit-instaquote", body: {}, label: "Q1" });
    await q.flushQueue();
    const rows = await q.listQueue("submissions");
    expect(rows).toHaveLength(1);
    expect(rows[0].attempts).toBe(1);
    expect(rows[0].lastError).toContain("boom");
  });

  it("skips flush when offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    invokeMock.mockResolvedValue({ data: {}, error: null });
    const q = await freshQueue();
    await q.queueSubmission({ fn: "public-submit-instaquote", body: {}, label: "Q1" });
    await q.flushQueue();
    expect(invokeMock).not.toHaveBeenCalled();
    expect((await q.listQueue("submissions"))).toHaveLength(1);
  });

  it("clearQueue removes all items in a store", async () => {
    const q = await freshQueue();
    await q.queueSubmission({ fn: "x", body: {} });
    await q.queueSubmission({ fn: "y", body: {} });
    await q.clearQueue("submissions");
    expect(await q.listQueue("submissions")).toHaveLength(0);
  });
});
