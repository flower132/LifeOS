import {
  LifeObject,
  Note,
  Relation,
  Tag,
  Template,
  AIAnalysisHistoryEntry,
} from "@/lib/types";
import { AppSettings } from "@/lib/storage/types";
import {
  ConflictStrategy,
  MergeResult,
  SyncEntity,
  SyncSnapshot,
} from "./types";

function isISODate(value: unknown): value is string {
  return typeof value === "string" && !isNaN(Date.parse(value));
}

function getTimestamp(value: unknown): number {
  if (isISODate(value)) return new Date(value).getTime();
  return 0;
}

function getSyncTimestamp(
  entity: SyncEntity,
  item: Record<string, unknown>
): number {
  switch (entity) {
    case "objects":
      return getTimestamp(item.updated_at);
    case "notes":
    case "relations":
      return getTimestamp(item.created_at);
    case "tags":
      return getTimestamp(item.createdAt);
    case "templates":
      return getTimestamp(item.updatedAt);
    case "aiAnalysisHistory":
      return getTimestamp(item.createdAt);
    case "settings":
      return 0;
    default:
      return 0;
  }
}

function mergeList<T extends { id: string }>(
  entity: SyncEntity,
  local: T[],
  remote: T[]
): { merged: T[]; keptLocal: number; keptRemote: number; mergedCount: number } {
  const remoteMap = new Map<string, T>();
  for (const item of remote) {
    remoteMap.set(item.id, item);
  }

  const merged: T[] = [];
  let keptLocal = 0;
  let keptRemote = 0;
  let mergedCount = 0;

  for (const localItem of local) {
    const remoteItem = remoteMap.get(localItem.id);
    if (!remoteItem) {
      merged.push(localItem);
      keptLocal++;
      continue;
    }

    const localTime = getSyncTimestamp(entity, localItem as Record<string, unknown>);
    const remoteTime = getSyncTimestamp(
      entity,
      remoteItem as Record<string, unknown>
    );

    if (localTime >= remoteTime) {
      merged.push(localItem);
    } else {
      merged.push(remoteItem);
    }
    mergedCount++;
    remoteMap.delete(localItem.id);
  }

  for (const remoteItem of remoteMap.values()) {
    merged.push(remoteItem);
    keptRemote++;
  }

  return { merged, keptLocal, keptRemote, mergedCount };
}

function mergeSettings(
  local: Partial<AppSettings>,
  remote: Partial<AppSettings>,
  strategy: ConflictStrategy
): Partial<AppSettings> {
  if (strategy === "local") return { ...local };
  if (strategy === "remote") return { ...remote };
  return { ...remote, ...local };
}

export function mergeSnapshots(
  local: SyncSnapshot,
  remote: SyncSnapshot,
  settingsStrategy: ConflictStrategy = "merge"
): MergeResult {
  const objectsMerge = mergeList<LifeObject>("objects", local.objects, remote.objects);
  const notesMerge = mergeList<Note>("notes", local.notes, remote.notes);
  const relationsMerge = mergeList<Relation>(
    "relations",
    local.relations,
    remote.relations
  );
  const tagsMerge = mergeList<Tag>("tags", local.tags, remote.tags);
  const templatesMerge = mergeList<Template>(
    "templates",
    local.templates,
    remote.templates
  );
  const historyMerge = mergeList<AIAnalysisHistoryEntry>(
    "aiAnalysisHistory",
    local.aiAnalysisHistory,
    remote.aiAnalysisHistory
  );

  const snapshot: SyncSnapshot = {
    objects: objectsMerge.merged,
    notes: notesMerge.merged,
    relations: relationsMerge.merged,
    tags: tagsMerge.merged,
    templates: templatesMerge.merged,
    settings: mergeSettings(local.settings, remote.settings, settingsStrategy),
    aiAnalysisHistory: historyMerge.merged,
  };

  const keptLocalCount =
    objectsMerge.keptLocal +
    notesMerge.keptLocal +
    relationsMerge.keptLocal +
    tagsMerge.keptLocal +
    templatesMerge.keptLocal +
    historyMerge.keptLocal;

  const keptRemoteCount =
    objectsMerge.keptRemote +
    notesMerge.keptRemote +
    relationsMerge.keptRemote +
    tagsMerge.keptRemote +
    templatesMerge.keptRemote +
    historyMerge.keptRemote;

  const mergedCount =
    objectsMerge.mergedCount +
    notesMerge.mergedCount +
    relationsMerge.mergedCount +
    tagsMerge.mergedCount +
    templatesMerge.mergedCount +
    historyMerge.mergedCount;

  const totalCount =
    snapshot.objects.length +
    snapshot.notes.length +
    snapshot.relations.length +
    snapshot.tags.length +
    snapshot.templates.length +
    snapshot.aiAnalysisHistory.length;

  return {
    snapshot,
    stats: {
      keptLocalCount,
      keptRemoteCount,
      mergedCount,
      totalCount,
    },
  };
}

export function applyStrategy(
  local: SyncSnapshot,
  remote: SyncSnapshot,
  strategy: ConflictStrategy
): SyncSnapshot {
  if (strategy === "local") {
    return { ...local };
  }
  if (strategy === "remote") {
    return { ...remote };
  }
  return mergeSnapshots(local, remote, strategy).snapshot;
}
