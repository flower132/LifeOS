import { QueueItem, SyncEntity } from "./types";
import { generateId } from "@/lib/id";

const QUEUE_KEY = "lifeos_sync_queue";

function readQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as QueueItem[];
  } catch {
    // ignore corrupt queue
  }
  return [];
}

function writeQueue(queue: QueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore quota errors
  }
}

export function getPendingQueue(): QueueItem[] {
  return readQueue();
}

export function enqueueSyncItem(
  entity: SyncEntity | undefined,
  recordId?: string,
  action: QueueItem["action"] = "upsert"
): QueueItem {
  const queue = readQueue();
  const item: QueueItem = {
    id: generateId(),
    entity: entity ?? "objects",
    recordId,
    action,
    enqueuedAt: new Date().toISOString(),
    retries: 0,
  };
  queue.push(item);
  writeQueue(queue);
  return item;
}

export function removeSyncItem(id: string): void {
  const queue = readQueue().filter((item) => item.id !== id);
  writeQueue(queue);
}

export function incrementRetry(id: string): QueueItem | null {
  const queue = readQueue();
  const item = queue.find((i) => i.id === id);
  if (!item) return null;
  item.retries += 1;
  writeQueue(queue);
  return item;
}

export function clearSyncQueue(): void {
  writeQueue([]);
}

export function getPendingCount(): number {
  return readQueue().length;
}
