// Tiny IndexedDB wrapper for the offline queue. No external deps.
// Stores three kinds of queued work: submissions (bookings/quotes), reminders,
// and analytics events. Each record has an auto-incrementing id.

const DB_NAME = "solhq-offline";
const DB_VERSION = 1;
export type QueueKind = "submissions" | "reminders" | "analytics";
const STORES: QueueKind[] = ["submissions", "reminders", "analytics"];

export interface QueuedRecord<T = unknown> {
  id?: number;
  createdAt: number;
  attempts: number;
  lastError?: string;
  payload: T;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id", autoIncrement: true });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: QueueKind, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

export async function idbAdd<T>(store: QueueKind, payload: T): Promise<number> {
  const record: QueuedRecord<T> = { createdAt: Date.now(), attempts: 0, payload };
  const id = await tx<IDBValidKey>(store, "readwrite", (s) => s.add(record));
  return Number(id);
}

export async function idbAll<T>(store: QueueKind): Promise<QueuedRecord<T>[]> {
  return tx<QueuedRecord<T>[]>(store, "readonly", (s) => s.getAll() as IDBRequest<QueuedRecord<T>[]>);
}

export async function idbUpdate<T>(store: QueueKind, record: QueuedRecord<T>): Promise<void> {
  await tx(store, "readwrite", (s) => s.put(record));
}

export async function idbDelete(store: QueueKind, id: number): Promise<void> {
  await tx(store, "readwrite", (s) => s.delete(id));
}

export async function idbCount(store: QueueKind): Promise<number> {
  return tx<number>(store, "readonly", (s) => s.count());
}

export async function idbClear(store: QueueKind): Promise<void> {
  await tx(store, "readwrite", (s) => s.clear());
}
