import { LifeObject } from "@/lib/types";
import { storage } from "@/lib/storage";
import { useObjectIntelligenceStore } from "@/stores/objectIntelligenceStore";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { memoryService } from "@/lib/memory/memoryService";
import { memoriesForObject } from "@/lib/memory/strategies/shared";
import { Memory } from "@/lib/memory/types";
import {
  generateCommunicationAdvice,
  generateObjectProfile,
  PersonAdvice,
  updateObjectProfileIncremental,
} from "./analyzer";
import { buildRelationshipGraph, RelationshipGraph } from "./relationship";
import { buildObjectTimeline, ObjectTimelineEntry } from "./timeline";
import {
  analyzeGoalProgress,
  assessProjectHealth,
  GoalInsight,
  ProjectHealth,
} from "./recommendation";
import { ObjectProfile, StoredObjectProfile } from "./types";

// ---------------------------------------------------------------------------
// Object Intelligence Engine — the public facade. Turns objects into living
// digital objects: AI profile + relationship graph + timeline + advice,
// cached and incrementally updated in the background (see updater.ts).
// ---------------------------------------------------------------------------

function profileStore() {
  return useObjectIntelligenceStore.getState();
}

async function persistProfile(
  objectId: string,
  profile: ObjectProfile
): Promise<StoredObjectProfile> {
  const existing = profileStore().profiles[objectId];
  if (existing) {
    const updated = await storage.updateObjectProfile(existing.id, { profile });
    profileStore().upsertLocal(updated);
    return updated;
  }
  const created = await storage.createObjectProfile({ objectId, profile });
  profileStore().upsertLocal(created);
  return created;
}

class ObjectIntelligenceEngine {
  /** Cached profile (sync read for UI). Undefined when not generated yet. */
  getProfile(objectId: string): ObjectProfile | undefined {
    return profileStore().profiles[objectId]?.profile;
  }

  /** Full generate + persist. */
  async refreshProfile(object: LifeObject): Promise<ObjectProfile | null> {
    const allObjects = useObjectStore.getState().objects;
    const profile = await generateObjectProfile(object, allObjects);
    if (!profile) return null;
    await persistProfile(object.id, profile);
    return profile;
  }

  /**
   * Incremental update after new memories arrive. Falls back to a full
   * generate when no profile exists yet.
   */
  async updateProfileIncremental(
    object: LifeObject,
    newMemories: Memory[]
  ): Promise<ObjectProfile | null> {
    const existing = this.getProfile(object.id);
    if (!existing) {
      return this.refreshProfile(object);
    }

    const newNotes = useNoteStore
      .getState()
      .notes.filter(
        (n) =>
          n.object_id === object.id &&
          new Date(n.created_at).getTime() > existing.lastUpdated
      )
      .slice(0, 8);

    const profile = await updateObjectProfileIncremental(
      object,
      existing,
      newMemories,
      newNotes
    );
    if (!profile) return null;
    await persistProfile(object.id, profile);
    return profile;
  }

  /** Communication Assistant (PERSON_ADVICE). */
  async getCommunicationAdvice(
    person: LifeObject,
    situation: string
  ): Promise<PersonAdvice | null> {
    const profile = this.getProfile(person.id) ?? null;
    return generateCommunicationAdvice(person, profile, situation);
  }

  /** Relationship graph (ego view when objectId given). */
  getRelationshipGraph(focusObjectId?: string): RelationshipGraph {
    return buildRelationshipGraph({
      objects: useObjectStore.getState().objects,
      relations: useRelationStore.getState().relations,
      memories: useMemoryStore.getState().memories,
      focusObjectId,
    });
  }

  /** Auto-generated per-object timeline from memories + notes. */
  getObjectTimeline(objectId: string): ObjectTimelineEntry[] {
    return buildObjectTimeline({
      memories: memoriesForObject(objectId, useMemoryStore.getState().memories),
      notes: useNoteStore
        .getState()
        .notes.filter((n) => n.object_id === objectId),
    });
  }

  /** Goal Insight: 为什么停滞 / 阻碍 / 下一步建议。 */
  getGoalInsight(object: LifeObject): GoalInsight {
    return analyzeGoalProgress({
      object,
      memories: memoriesForObject(object.id, useMemoryStore.getState().memories),
      notes: useNoteStore.getState().notes.filter((n) => n.object_id === object.id),
      profile: this.getProfile(object.id),
    });
  }

  /** Project Health: 🟢/🟡/🔴。 */
  getProjectHealth(object: LifeObject): ProjectHealth {
    return assessProjectHealth({
      object,
      memories: memoriesForObject(object.id, useMemoryStore.getState().memories),
      notes: useNoteStore.getState().notes.filter((n) => n.object_id === object.id),
      profile: this.getProfile(object.id),
    });
  }

  /** Durable knowledge lines from the Memory & Knowledge Layer. */
  getKnowledgeLines(objectId: string): string[] {
    return memoryService.getObjectKnowledgeSync(objectId);
  }

  /** Object deletion cleanup: drop the cached profile record too. */
  async removeProfilesFor(objectIds: string[]): Promise<void> {
    for (const objectId of objectIds) {
      const stored = profileStore().profiles[objectId];
      if (!stored) continue;
      try {
        await storage.deleteObjectProfile(stored.id);
      } catch (err) {
        console.warn("[object-intelligence] Failed to delete profile:", err);
      }
      profileStore().removeByObjectId(objectId);
    }
  }
}

export const objectIntelligenceEngine = new ObjectIntelligenceEngine();
