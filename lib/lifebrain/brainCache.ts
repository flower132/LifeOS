// ---------------------------------------------------------------------------
// Brain Cache — TTL cache for graph contexts, summaries and serialized
// blocks, with data-version invalidation and incremental refresh.
//
//   - TTL per entry kind
//   - version key: entries die when underlying store data changes
//   - getOrCompute: read-through with single-flight refresh
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  ttlMs: number;
  version: string;
}

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** Version stamp of the data world — bump when stores change. */
let dataVersion = "0";
export function bumpBrainDataVersion(): void {
  dataVersion = String(Date.now());
}
export function getBrainDataVersion(): string {
  return dataVersion;
}

export const BRAIN_CACHE_TTL = {
  graphContext: 5 * 60 * 1000,
  timelineSummary: 24 * 60 * 60 * 1000,
  objectSummary: 10 * 60 * 1000,
  lifeSummary: 24 * 60 * 60 * 1000,
  serialized: 5 * 60 * 1000,
} as const;

export function brainCacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.createdAt > entry.ttlMs) {
    store.delete(key);
    return null;
  }
  if (entry.version !== dataVersion) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function brainCacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, {
    value,
    createdAt: Date.now(),
    ttlMs,
    version: dataVersion,
  });
}

/** Read-through with TTL + single-flight (no stampedes). */
export async function brainCacheGetOrCompute<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>
): Promise<T> {
  const cached = brainCacheGet<T>(key);
  if (cached !== null) return cached;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = compute()
    .then((value) => {
      brainCacheSet(key, value, ttlMs);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise as Promise<unknown>);
  return promise;
}

/** Synchronous variant for store-derived (non-AI) computations. */
export function brainCacheComputeSync<T>(
  key: string,
  ttlMs: number,
  compute: () => T
): T {
  const cached = brainCacheGet<T>(key);
  if (cached !== null) return cached;
  const value = compute();
  brainCacheSet(key, value, ttlMs);
  return value;
}

export function brainCacheClear(): void {
  store.clear();
}

// ---------------------------------------------------------------------------
// Automatic invalidation: any store mutation bumps the data version, killing
// versioned cache entries (TTL still bounds unversioned freshness).
// ---------------------------------------------------------------------------

if (typeof window !== "undefined") {
  void import("@/stores/storeEvents").then(({ subscribe }) => {
    const EVENTS = [
      "objectsChanged",
      "notesChanged",
      "relationsChanged",
      "tagsChanged",
      "settingsChanged",
      "templatesChanged",
    ] as const;
    for (const event of EVENTS) {
      subscribe(event, () => bumpBrainDataVersion());
    }
  });
}
