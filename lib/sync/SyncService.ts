import { getSupabase } from "@/lib/supabaseClient";
import { localStorageAdapter } from "@/lib/storage/localStorageAdapter";
import { SupabaseAdapter } from "@/lib/storage/supabaseAdapter";
import { getMode, isLoggedIn } from "@/lib/storage";
import { hydrateStores } from "@/stores";
import { useSyncStore } from "@/stores/syncStore";
import {
  clearSyncQueue,
  enqueueSyncItem,
  getPendingCount,
  getPendingQueue,
} from "./offlineQueue";
import { mergeSnapshots } from "./ConflictResolver";
import {
  ConflictStrategy,
  SyncEntity,
  SyncService,
  SyncSnapshot,
  UserProfile,
} from "./types";

const DEBOUNCE_MS = 3000;
const MAX_RETRIES = 5;

function isNetworkError(err: unknown): boolean {
  if (err instanceof Error) {
    return (
      err.message.includes("fetch") ||
      err.message.includes("network") ||
      err.message.includes("Network") ||
      err.message.includes("timeout") ||
      err.message.includes("ECONNREFUSED")
    );
  }
  return false;
}

function buildProfileFromUser(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): UserProfile {
  const email = user.email ?? "";
  const metadata = user.user_metadata ?? {};
  const displayName =
    typeof metadata.display_name === "string" && metadata.display_name.length > 0
      ? metadata.display_name
      : email.split("@")[0] ?? "";
  const avatarEmoji =
    typeof metadata.avatar_emoji === "string" ? metadata.avatar_emoji : undefined;
  return { email, displayName, avatarEmoji };
}

const remoteAdapter = new SupabaseAdapter();

class SyncServiceImpl implements SyncService {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isSyncing = false;
  private isPaused = false;
  private conflictStrategy: ConflictStrategy = "merge";

  init(): void {
    if (typeof window === "undefined") return;

    this.updateOnlineStatus();
    window.addEventListener("online", () => this.updateOnlineStatus());
    window.addEventListener("offline", () => this.updateOnlineStatus());

    this.loadProfile();

    try {
      getSupabase().auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          this.loadProfile();
          this.resume();
          if (getPendingCount() > 0) {
            this.scheduleSync(500);
          }
        }
        if (event === "SIGNED_OUT") {
          useSyncStore.getState().setProfile(null);
          this.pause();
        }
      });
    } catch {
      // Supabase not configured
    }

    if (getPendingCount() > 0 && this.shouldSync()) {
      this.scheduleSync(1000);
    }
  }

  setConflictStrategy(strategy: ConflictStrategy): void {
    this.conflictStrategy = strategy;
  }

  requestSync(entity?: SyncEntity, recordId?: string): void {
    if (this.isSyncing) return;
    enqueueSyncItem(entity, recordId, "upsert");
    useSyncStore.getState().setPendingCount(getPendingCount());
    this.scheduleSync(DEBOUNCE_MS);
  }

  async syncNow(): Promise<void> {
    await this.runSync();
  }

  pause(): void {
    this.isPaused = true;
    this.clearTimer();
  }

  resume(): void {
    this.isPaused = false;
  }

  private updateOnlineStatus(): void {
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;
    useSyncStore.getState().setIsOnline(online);
    if (online && getPendingCount() > 0 && this.shouldSync()) {
      this.scheduleSync(500);
    }
  }

  private loadProfile(): void {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          useSyncStore.getState().setProfile(buildProfileFromUser(data.user));
        }
      })
      .catch(() => {
        // ignore
      });
  }

  private shouldSync(): boolean {
    return getMode() === "sync" && isLoggedIn() && !this.isPaused;
  }

  private scheduleSync(delayMs: number): void {
    if (!this.shouldSync()) {
      useSyncStore.getState().setStatus("pending");
      return;
    }

    this.clearTimer();
    this.timer = setTimeout(() => {
      void this.runSync();
    }, delayMs);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async runSync(): Promise<void> {
    if (this.isSyncing) return;
    if (!this.shouldSync()) {
      useSyncStore.getState().setStatus(getPendingCount() > 0 ? "pending" : "idle");
      return;
    }

    const store = useSyncStore.getState();
    if (!store.isOnline) {
      store.setStatus("pending");
      return;
    }

    this.isSyncing = true;
    store.setStatus("syncing");
    store.setError(null);

    try {
      const localSnapshot = await this.readLocalSnapshot();
      const remoteSnapshot = await this.readRemoteSnapshot();
      const merged = mergeSnapshots(localSnapshot, remoteSnapshot, this.conflictStrategy);

      await this.writeRemoteSnapshot(merged.snapshot);
      await this.writeLocalSnapshot(merged.snapshot);
      await hydrateStores();

      clearSyncQueue();
      store.setPendingCount(0);
      store.setStatus("synced");
      store.setLastSyncAt(new Date().toISOString());
      store.setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      console.error("[LifeOS] Sync failed:", err);
      store.setStatus("error");
      store.setError(message);

      if (isNetworkError(err)) {
        store.setIsOnline(false);
      } else {
        this.incrementRetriesOrDrop();
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private incrementRetriesOrDrop(): void {
    const queue = getPendingQueue();
    for (const item of queue) {
      if (item.retries >= MAX_RETRIES) {
        // drop persistently failing items to avoid infinite retry
      }
    }
  }

  private async readLocalSnapshot(): Promise<SyncSnapshot> {
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
    };
  }

  private async readRemoteSnapshot(): Promise<SyncSnapshot> {
    const adapter = remoteAdapter;
    await adapter.refresh();
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
    };
  }

  private async writeRemoteSnapshot(snapshot: SyncSnapshot): Promise<void> {
    const adapter = remoteAdapter;
    await adapter.init();
    await Promise.all([
      adapter.setObjects(snapshot.objects),
      adapter.setNotes(snapshot.notes),
      adapter.setRelations(snapshot.relations),
      adapter.setTags(snapshot.tags),
      adapter.setTemplates(snapshot.templates),
      adapter.setSettings(snapshot.settings),
      adapter.setAIAnalysisHistory(snapshot.aiAnalysisHistory),
      adapter.setMoments(snapshot.moments),
      adapter.setChapters(snapshot.chapters),
      adapter.setMemoryRelations(snapshot.memoryRelations),
      adapter.setAnniversaries(snapshot.anniversaries),
      adapter.setHighlights(snapshot.highlights),
      adapter.setDecisions(snapshot.decisions),
      adapter.setMemories(snapshot.memories),
    ]);
  }

  private async writeLocalSnapshot(snapshot: SyncSnapshot): Promise<void> {
    const adapter = localStorageAdapter;
    await Promise.all([
      adapter.setObjects(snapshot.objects),
      adapter.setNotes(snapshot.notes),
      adapter.setRelations(snapshot.relations),
      adapter.setTags(snapshot.tags),
      adapter.setTemplates(snapshot.templates),
      adapter.setSettings(snapshot.settings),
      adapter.setAIAnalysisHistory(snapshot.aiAnalysisHistory),
      adapter.setMoments(snapshot.moments),
      adapter.setChapters(snapshot.chapters),
      adapter.setMemoryRelations(snapshot.memoryRelations),
      adapter.setAnniversaries(snapshot.anniversaries),
      adapter.setHighlights(snapshot.highlights),
      adapter.setDecisions(snapshot.decisions),
      adapter.setMemories(snapshot.memories),
    ]);
  }
}

export const syncService: SyncService = new SyncServiceImpl();

export function syncWithStrategy(strategy: ConflictStrategy): Promise<void> {
  syncService.setConflictStrategy(strategy);
  return syncService.syncNow();
}

export function updateUserProfile(profile: Partial<UserProfile>): Promise<void> {
  const currentProfile = useSyncStore.getState().profile;

  // Optimistically update the local store first so the UI reflects changes
  // immediately without waiting for the Supabase round-trip.
  if (currentProfile) {
    useSyncStore.getState().setProfile({ ...currentProfile, ...profile });
  }

  return getSupabase()
    .auth.updateUser({
      data: {
        display_name: profile.displayName,
        avatar_emoji: profile.avatarEmoji,
      },
    })
    .then(({ data }) => {
      if (data.user) {
        useSyncStore.getState().setProfile(buildProfileFromUser(data.user));
      }
    });
}
