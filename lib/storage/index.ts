import { LocalStorageAdapter, STORAGE_VERSION } from "./localStorageAdapter";
import { HybridStorageAdapter } from "./hybridAdapter";
import type { StorageAdapter } from "./types";
import { getSupabase, resetSupabase } from "@/lib/supabaseClient";

type Mode = "local" | "sync";

// ---- internal helpers ------------------------------------------------
function readMode(): Mode {
  if (typeof window === "undefined") return "local";
  return (localStorage.getItem("lifeos-mode") as Mode) || "local";
}

export function setMode(mode: Mode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("lifeos-mode", mode);
}

export function getMode(): Mode {
  return readMode();
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("lifeos-supabase-auth");
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return !!parsed?.access_token;
  } catch {
    return false;
  }
}

// ---- adapter instances ---------------------------------------------------
let _hybridAdapter: HybridStorageAdapter | null = null;

function getHybridAdapter(): HybridStorageAdapter {
  if (!_hybridAdapter) {
    _hybridAdapter = new HybridStorageAdapter();
  }
  return _hybridAdapter;
}

const localAdapter = new LocalStorageAdapter();

function getActiveAdapter(): StorageAdapter {
  const mode = readMode();
  if (mode === "sync" && isLoggedIn()) {
    return getHybridAdapter() as unknown as StorageAdapter;
  }
  return localAdapter as unknown as StorageAdapter;
}

// ---- storage proxy (delegates to active adapter) -----------------------
const STORAGE_METHODS: (keyof StorageAdapter)[] = [
  "getStorageVersion", "setStorageVersion", "migrateIfNeeded", "ensureDefaultTemplates",
  "getObjects", "getObjectById", "createObject", "updateObject", "deleteObject", "deleteObjects", "restoreObjects", "setObjects",
  "getNotes", "getNotesByObjectId", "createNote", "deleteNote", "setNotes",
  "getRelations", "getRelationsByObjectId", "createRelation", "deleteRelation", "setRelations",
  "getTags", "createTag", "updateTag", "deleteTag", "setTags",
  "getTemplates", "createTemplate", "updateTemplate", "deleteTemplate", "setTemplates",
  "getSettings", "setSettings",
  "getAIAnalysisHistory", "getAIAnalysisHistoryByObjectId", "getAIAnalysisHistoryByType",
  "getAIAnalysisHistoryEntryById", "createAIAnalysisHistory", "updateAIAnalysisHistoryObjectId",
  "deleteAIAnalysisHistory", "clearAIAnalysisHistory", "setAIAnalysisHistory",
  "getIntelligenceCache", "setIntelligenceCache", "getIntelligenceMeta", "setIntelligenceMeta",
  "getTodayStory", "createTodayStory",
  "getCompanionMeta", "setCompanionMeta",
  "getMoments", "createMoment", "updateMoment", "deleteMoment", "setMoments",
  "getChapters", "createChapter", "updateChapter", "deleteChapter", "setChapters",
  "getMemoryRelations", "createMemoryRelation", "deleteMemoryRelation", "setMemoryRelations",
  "getAnniversaries", "createAnniversary", "deleteAnniversary", "setAnniversaries",
  "getHighlights", "createHighlight", "deleteHighlight", "setHighlights",
  "getDecisions", "createDecision", "updateDecision", "deleteDecision", "setDecisions",
];

const storageProxy = {} as StorageAdapter;
for (const method of STORAGE_METHODS) {
  (storageProxy as unknown as Record<string, unknown>)[method] = async (...args: unknown[]) => {
    const adapter = getActiveAdapter();
    return (adapter as unknown as Record<string, (...a: unknown[]) => unknown>)[method](...args);
  };
}

export const storage: StorageAdapter = storageProxy;

// ---- auth helpers -------------------------------------------------------
export async function signOut(): Promise<void> {
  try {
    await getSupabase().auth.signOut();
  } catch {
    // ignore if supabase is not configured
  }
  localStorage.removeItem("lifeos-supabase-auth");
  _hybridAdapter = null;
  resetSupabase();
}

export { LocalStorageAdapter, STORAGE_VERSION };
export type { StorageAdapter } from "./types";
