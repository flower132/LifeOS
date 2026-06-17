export type StoreEvent =
  | "objectsChanged"
  | "tagsChanged"
  | "notesChanged"
  | "relationsChanged"
  | "settingsChanged"
  | "templatesChanged";

const listeners = new Map<StoreEvent, Set<() => void>>();

export function subscribe(event: StoreEvent, callback: () => void): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  const set = listeners.get(event)!;
  set.add(callback);
  return () => {
    set.delete(callback);
  };
}

export function emit(event: StoreEvent): void {
  listeners.get(event)?.forEach((callback) => {
    try {
      callback();
    } catch (err) {
      console.error(`[LifeOS] Store event listener for ${event} failed:`, err);
    }
  });
}
