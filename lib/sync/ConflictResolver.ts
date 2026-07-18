import {
  LifeObject,
  Note,
  Relation,
  Tag,
  Template,
  AIAnalysisHistoryEntry,
  MemoryMoment,
  LifeChapter,
  MemoryRelationEdge,
  Anniversary,
  Highlight,
  DecisionMemory,
} from "@/lib/types";
import { AppSettings } from "@/lib/storage/types";
import { Memory as UnifiedMemory } from "@/lib/memory/types";
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
    case "moments":
    case "chapters":
    case "decisions":
      return getTimestamp(item.updatedAt);
    case "memoryRelations":
    case "anniversaries":
    case "highlights":
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
  const momentsMerge = mergeList<MemoryMoment>("moments", local.moments, remote.moments);
  const chaptersMerge = mergeList<LifeChapter>("chapters", local.chapters, remote.chapters);
  const memoryRelationsMerge = mergeList<MemoryRelationEdge>(
    "memoryRelations",
    local.memoryRelations,
    remote.memoryRelations
  );
  const anniversariesMerge = mergeList<Anniversary>(
    "anniversaries",
    local.anniversaries,
    remote.anniversaries
  );
  const highlightsMerge = mergeList<Highlight>("highlights", local.highlights, remote.highlights);
  const decisionsMerge = mergeList<DecisionMemory>("decisions", local.decisions, remote.decisions);
  const memoriesMerge = mergeList<UnifiedMemory>("memories", local.memories, remote.memories);

  const snapshot: SyncSnapshot = {
    objects: objectsMerge.merged,
    notes: notesMerge.merged,
    relations: relationsMerge.merged,
    tags: tagsMerge.merged,
    templates: templatesMerge.merged,
    settings: mergeSettings(local.settings, remote.settings, settingsStrategy),
    aiAnalysisHistory: historyMerge.merged,
    moments: momentsMerge.merged,
    chapters: chaptersMerge.merged,
    memoryRelations: memoryRelationsMerge.merged,
    anniversaries: anniversariesMerge.merged,
    highlights: highlightsMerge.merged,
    decisions: decisionsMerge.merged,
    memories: memoriesMerge.merged,
  };

  const keptLocalCount =
    objectsMerge.keptLocal +
    notesMerge.keptLocal +
    relationsMerge.keptLocal +
    tagsMerge.keptLocal +
    templatesMerge.keptLocal +
    historyMerge.keptLocal +
    momentsMerge.keptLocal +
    chaptersMerge.keptLocal +
    memoryRelationsMerge.keptLocal +
    anniversariesMerge.keptLocal +
    highlightsMerge.keptLocal +
    decisionsMerge.keptLocal;

  const keptRemoteCount =
    objectsMerge.keptRemote +
    notesMerge.keptRemote +
    relationsMerge.keptRemote +
    tagsMerge.keptRemote +
    templatesMerge.keptRemote +
    historyMerge.keptRemote +
    momentsMerge.keptRemote +
    chaptersMerge.keptRemote +
    memoryRelationsMerge.keptRemote +
    anniversariesMerge.keptRemote +
    highlightsMerge.keptRemote +
    decisionsMerge.keptRemote;

  const mergedCount =
    objectsMerge.mergedCount +
    notesMerge.mergedCount +
    relationsMerge.mergedCount +
    tagsMerge.mergedCount +
    templatesMerge.mergedCount +
    historyMerge.mergedCount +
    momentsMerge.mergedCount +
    chaptersMerge.mergedCount +
    memoryRelationsMerge.mergedCount +
    anniversariesMerge.mergedCount +
    highlightsMerge.mergedCount +
    decisionsMerge.mergedCount;

  const totalCount =
    snapshot.objects.length +
    snapshot.notes.length +
    snapshot.relations.length +
    snapshot.tags.length +
    snapshot.templates.length +
    snapshot.aiAnalysisHistory.length +
    snapshot.moments.length +
    snapshot.chapters.length +
    snapshot.memoryRelations.length +
    snapshot.anniversaries.length +
    snapshot.highlights.length +
    snapshot.decisions.length;

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
