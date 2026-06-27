import { v4 as uuidv4 } from "uuid";
import {
  LifeObjectType,
  AIAnalysisHistoryEntry,
  ObjectAIProfile,
  ObjectAIInsight,
  ObjectAISuggestion,
  ObjectMemory,
} from "@/lib/types";
import { storage } from "@/lib/storage";
import { normalizeAIAnalysisHistoryEntry } from "./normalize";

const MAX_THUMBNAILS = 3;

/**
 * AI Analysis History facade.
 *
 * These functions delegate to the active StorageAdapter so the AI layer never
 * directly touches localStorage or Supabase. They are kept as a thin API for
 * callers inside the AI/Object Intelligence modules.
 */

export async function getAIAnalysisHistory(): Promise<AIAnalysisHistoryEntry[]> {
  return storage.getAIAnalysisHistory();
}

export async function addAIAnalysisHistory(
  entry: Omit<AIAnalysisHistoryEntry, "id" | "createdAt">
): Promise<AIAnalysisHistoryEntry> {
  const normalized = normalizeAIAnalysisHistoryEntry({
    ...entry,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  });

  if (!normalized) {
    throw new Error("Invalid AI analysis history entry");
  }

  return storage.createAIAnalysisHistory(normalized);
}

export async function deleteAIAnalysisHistory(id: string): Promise<void> {
  return storage.deleteAIAnalysisHistory(id);
}

export async function clearAIAnalysisHistory(): Promise<void> {
  return storage.clearAIAnalysisHistory();
}

export async function getAIAnalysisHistoryByObjectId(
  objectId: string
): Promise<AIAnalysisHistoryEntry[]> {
  return storage.getAIAnalysisHistoryByObjectId(objectId);
}

export async function getAIAnalysisHistoryByType(
  objectType: LifeObjectType
): Promise<AIAnalysisHistoryEntry[]> {
  return storage.getAIAnalysisHistoryByType(objectType);
}

export async function getAIAnalysisHistoryEntryById(
  id: string
): Promise<AIAnalysisHistoryEntry | null> {
  return storage.getAIAnalysisHistoryEntryById(id);
}

export async function updateAIAnalysisHistoryObjectId(
  historyId: string,
  objectId: string
): Promise<void> {
  return storage.updateAIAnalysisHistoryObjectId(historyId, objectId);
}

export function createAIAnalysisHistoryEntryInput(params: {
  objectType: LifeObjectType;
  rawTextInput: string;
  imageCount: number;
  imageThumbnails: string[];
  provider: string;
  model: string;
  durationMs: number;
  rawOutput: string;
  profileSnapshot?: ObjectAIProfile;
  insightsSnapshot?: ObjectAIInsight[];
  suggestionsSnapshot?: ObjectAISuggestion[];
  memoriesSnapshot?: ObjectMemory[];
}): Omit<AIAnalysisHistoryEntry, "id" | "createdAt"> {
  return {
    objectType: params.objectType,
    rawTextInput: params.rawTextInput,
    imageCount: params.imageCount,
    imageThumbnails: params.imageThumbnails.slice(0, MAX_THUMBNAILS),
    provider: params.provider,
    model: params.model,
    durationMs: params.durationMs,
    rawOutput: params.rawOutput,
    profileSnapshot: params.profileSnapshot,
    insightsSnapshot: params.insightsSnapshot,
    suggestionsSnapshot: params.suggestionsSnapshot,
    memoriesSnapshot: params.memoriesSnapshot,
  };
}
