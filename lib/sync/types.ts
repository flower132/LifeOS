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

export type SyncEntity =
  | "objects"
  | "notes"
  | "relations"
  | "tags"
  | "templates"
  | "settings"
  | "aiAnalysisHistory"
  | "moments"
  | "chapters"
  | "memoryRelations"
  | "anniversaries"
  | "highlights"
  | "decisions"
  | "memories";

export type SyncStatus = "idle" | "syncing" | "synced" | "pending" | "error";

export type ConflictStrategy = "merge" | "local" | "remote";

export interface SyncSnapshot {
  objects: LifeObject[];
  notes: Note[];
  relations: Relation[];
  tags: Tag[];
  templates: Template[];
  settings: Partial<AppSettings>;
  aiAnalysisHistory: AIAnalysisHistoryEntry[];
  moments: MemoryMoment[];
  chapters: LifeChapter[];
  memoryRelations: MemoryRelationEdge[];
  anniversaries: Anniversary[];
  highlights: Highlight[];
  decisions: DecisionMemory[];
  memories: UnifiedMemory[];
}

export interface QueueItem {
  id: string;
  entity: SyncEntity;
  recordId?: string;
  action: "upsert" | "delete";
  enqueuedAt: string;
  retries: number;
}

export interface RemoteSummary {
  objects: number;
  notes: number;
  relations: number;
  tags: number;
  templates: number;
  settings: number;
  aiAnalysisHistory: number;
  moments: number;
  chapters: number;
  memoryRelations: number;
  anniversaries: number;
  highlights: number;
  decisions: number;
  hasData: boolean;
}

export interface DataStats {
  objects: number;
  memories: number;
  notes: number;
  relations: number;
  tags: number;
  templates: number;
}

export interface UserProfile {
  email: string;
  displayName: string;
  avatarEmoji?: string;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  error: string | null;
  isOnline: boolean;
  pendingCount: number;
  profile: UserProfile | null;
}

export interface MergeResult {
  snapshot: SyncSnapshot;
  stats: {
    keptLocalCount: number;
    keptRemoteCount: number;
    mergedCount: number;
    totalCount: number;
  };
}

export interface SyncService {
  init(): void;
  requestSync(entity?: SyncEntity, recordId?: string): void;
  syncNow(): Promise<void>;
  pause(): void;
  resume(): void;
  setConflictStrategy(strategy: ConflictStrategy): void;
}
