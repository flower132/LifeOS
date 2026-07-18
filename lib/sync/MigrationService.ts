import { localStorageAdapter } from "@/lib/storage/localStorageAdapter";
import { SupabaseAdapter } from "@/lib/storage/supabaseAdapter";
import { getMode, isLoggedIn, setMode } from "@/lib/storage";
import { hydrateStores } from "@/stores";
import { hasLocalData, getLocalDataStats } from "./stats";
import { syncService, syncWithStrategy } from "./SyncService";
import { applyStrategy } from "./ConflictResolver";
import {
  ConflictStrategy,
  RemoteSummary,
  SyncSnapshot,
} from "./types";

const PENDING_KEY = "lifeos-migration-pending";

function getPendingUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PENDING_KEY);
}

export function setMigrationPending(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_KEY, userId);
  localStorage.setItem(`lifeos-migration-${userId}`, "pending");
}

export function clearMigrationPending(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_KEY);
  localStorage.setItem(`lifeos-migration-${userId}`, "done");
}

export async function getRemoteSummary(): Promise<RemoteSummary> {
  const adapter = new SupabaseAdapter();
  await adapter.init();
  const summary = await adapter.getRemoteSummary();
  return summary;
}

export async function buildLocalSnapshot(): Promise<SyncSnapshot> {
  const adapter = localStorageAdapter;
  const [
    objects,
    notes,
    relations,
    tags,
    templates,
    settings,
    aiAnalysisHistory,
    moments,
    chapters,
    memoryRelations,
    anniversaries,
    highlights,
    decisions,
    memories,
    objectProfiles,
  ] = await Promise.all([
    adapter.getObjects(),
    adapter.getNotes(),
    adapter.getRelations(),
    adapter.getTags(),
    adapter.getTemplates(),
    adapter.getSettings(),
    adapter.getAIAnalysisHistory(),
    adapter.getMoments(),
    adapter.getChapters(),
    adapter.getMemoryRelations(),
    adapter.getAnniversaries(),
    adapter.getHighlights(),
    adapter.getDecisions(),
    adapter.getMemories(),
    adapter.getObjectProfiles(),
  ]);
  return {
    objects,
    notes,
    relations,
    tags,
    templates,
    settings,
    aiAnalysisHistory,
    moments,
    chapters,
    memoryRelations,
    anniversaries,
    highlights,
    decisions,
    memories,
    objectProfiles,
  };
}

export async function buildRemoteSnapshot(): Promise<SyncSnapshot> {
  const adapter = new SupabaseAdapter();
  await adapter.init();
  const [
    objects,
    notes,
    relations,
    tags,
    templates,
    settings,
    aiAnalysisHistory,
    moments,
    chapters,
    memoryRelations,
    anniversaries,
    highlights,
    decisions,
    memories,
    objectProfiles,
  ] = await Promise.all([
    adapter.getObjects(),
    adapter.getNotes(),
    adapter.getRelations(),
    adapter.getTags(),
    adapter.getTemplates(),
    adapter.getSettings(),
    adapter.getAIAnalysisHistory(),
    adapter.getMoments(),
    adapter.getChapters(),
    adapter.getMemoryRelations(),
    adapter.getAnniversaries(),
    adapter.getHighlights(),
    adapter.getDecisions(),
    adapter.getMemories(),
    adapter.getObjectProfiles(),
  ]);
  return {
    objects,
    notes,
    relations,
    tags,
    templates,
    settings,
    aiAnalysisHistory,
    moments,
    chapters,
    memoryRelations,
    anniversaries,
    highlights,
    decisions,
    memories,
    objectProfiles,
  };
}

export type MigrationStatus =
  | "checking"
  | "empty"
  | "migrate"
  | "conflict"
  | "complete";

export interface MigrationCheckResult {
  status: MigrationStatus;
  localStats: ReturnType<typeof getLocalDataStats>;
  remoteSummary: RemoteSummary | null;
  localSnapshot: SyncSnapshot | null;
  remoteSnapshot: SyncSnapshot | null;
  userId: string | null;
}

export async function checkMigration(): Promise<MigrationCheckResult> {
  const userId = getPendingUserId();
  if (!userId || !isLoggedIn() || getMode() !== "sync") {
    return {
      status: "complete",
      localStats: getLocalDataStats(),
      remoteSummary: null,
      localSnapshot: null,
      remoteSnapshot: null,
      userId,
    };
  }

  const localHasData = hasLocalData();
  const remoteSummary = await getRemoteSummary();
  const remoteHasData = remoteSummary.hasData;

  const localSnapshot = localHasData || remoteHasData ? await buildLocalSnapshot() : null;
  const remoteSnapshot = localHasData || remoteHasData ? await buildRemoteSnapshot() : null;

  if (!localHasData && !remoteHasData) {
    return {
      status: "empty",
      localStats: getLocalDataStats(),
      remoteSummary,
      localSnapshot,
      remoteSnapshot,
      userId,
    };
  }

  if (!localHasData && remoteHasData) {
    return {
      status: "migrate",
      localStats: getLocalDataStats(),
      remoteSummary,
      localSnapshot,
      remoteSnapshot,
      userId,
    };
  }

  if (localHasData && !remoteHasData) {
    return {
      status: "migrate",
      localStats: getLocalDataStats(),
      remoteSummary,
      localSnapshot,
      remoteSnapshot,
      userId,
    };
  }

  return {
    status: "conflict",
    localStats: getLocalDataStats(),
    remoteSummary,
    localSnapshot,
    remoteSnapshot,
    userId,
  };
}

export async function migrateLocalToRemote(): Promise<void> {
  await syncWithStrategy("local");
  await completeMigration();
}

export async function pullRemoteToLocal(): Promise<void> {
  await syncWithStrategy("remote");
  await completeMigration();
}

export async function resolveConflict(strategy: ConflictStrategy): Promise<void> {
  if (strategy === "remote") {
    await syncWithStrategy("remote");
  } else if (strategy === "local") {
    await syncWithStrategy("local");
  } else {
    const local = await buildLocalSnapshot();
    const remote = await buildRemoteSnapshot();
    const merged = applyStrategy(local, remote, "merge");

    const adapter = new SupabaseAdapter();
    await adapter.init();
    await Promise.all([
      adapter.setObjects(merged.objects),
      adapter.setNotes(merged.notes),
      adapter.setRelations(merged.relations),
      adapter.setTags(merged.tags),
      adapter.setTemplates(merged.templates),
      adapter.setSettings(merged.settings),
      adapter.setAIAnalysisHistory(merged.aiAnalysisHistory),
      adapter.setMoments(merged.moments),
      adapter.setChapters(merged.chapters),
      adapter.setMemoryRelations(merged.memoryRelations),
      adapter.setAnniversaries(merged.anniversaries),
      adapter.setHighlights(merged.highlights),
      adapter.setDecisions(merged.decisions),
      adapter.setMemories(merged.memories),
      adapter.setObjectProfiles(merged.objectProfiles),
    ]);

    await localStorageAdapter.setObjects(merged.objects);
    await localStorageAdapter.setNotes(merged.notes);
    await localStorageAdapter.setRelations(merged.relations);
    await localStorageAdapter.setTags(merged.tags);
    await localStorageAdapter.setTemplates(merged.templates);
    await localStorageAdapter.setSettings(merged.settings);
    await localStorageAdapter.setAIAnalysisHistory(merged.aiAnalysisHistory);
    await localStorageAdapter.setMoments(merged.moments);
    await localStorageAdapter.setChapters(merged.chapters);
    await localStorageAdapter.setMemoryRelations(merged.memoryRelations);
    await localStorageAdapter.setAnniversaries(merged.anniversaries);
    await localStorageAdapter.setHighlights(merged.highlights);
    await localStorageAdapter.setDecisions(merged.decisions);
    await localStorageAdapter.setMemories(merged.memories);
    await localStorageAdapter.setObjectProfiles(merged.objectProfiles);

    syncService.setConflictStrategy("merge");
  }
  await completeMigration();
}

export async function completeMigration(): Promise<void> {
  const userId = getPendingUserId();
  if (userId) {
    clearMigrationPending(userId);
  }
  await hydrateStores();
}

export function shouldRedirectToMigration(): boolean {
  const userId = getPendingUserId();
  return !!userId && isLoggedIn() && getMode() === "sync";
}

export function abandonMigration(): void {
  const userId = getPendingUserId();
  if (userId) {
    clearMigrationPending(userId);
  }
  setMode("local");
}
