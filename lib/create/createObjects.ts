import { LifeObject } from "@/lib/types";
import { aiService } from "@/lib/ai";
import { getObjectDisplayName } from "@/lib/ai/objectIntelligence/mapper";
import { useObjectStore } from "@/stores/objectStore";
import { CreationDraft } from "./draftUtils";

export interface CreateObjectsResult {
  created: LifeObject[];
  skipped: number;
  errors: { draft: CreationDraft; error: string }[];
}

export async function createObjectsFromDrafts(
  drafts: CreationDraft[],
  t: (key: string, vars?: Record<string, string>) => string
): Promise<CreateObjectsResult> {
  const addObject = useObjectStore.getState().addObject;
  const result: CreateObjectsResult = {
    created: [],
    skipped: 0,
    errors: [],
  };

  for (const draft of drafts) {
    if (!draft.selected) continue;

    if (draft.duplicate?.action === "use-existing") {
      result.skipped++;
      continue;
    }

    try {
      const enriched = draft.enriched;
      const created = await addObject({
        type: draft.type,
        name:
          draft.name ||
          (enriched
            ? getObjectDisplayName(draft.type, enriched.properties)
            : t(`aiDefaultObjectName_${draft.type}`)),
        description: enriched?.analysisSummary || undefined,
        properties: enriched?.properties || {},
        aiProfile: enriched?.profile,
        aiInsights: enriched?.insights,
        aiSuggestions: enriched?.suggestions,
        memories: enriched?.memories,
        tag_ids: [],
      });
      result.created.push(created);
    } catch (err) {
      result.errors.push({
        draft,
        error: err instanceof Error ? err.message : t("failedToCreateObject"),
      });
    }
  }

  return result;
}

export async function enrichDraft(
  draft: CreationDraft
): Promise<CreationDraft> {
  const result = await aiService.analyzeObject(draft.type, {
    textInput: draft.context || draft.name,
    images: [],
  });

  if (!result.success || !result.data) {
    return {
      ...draft,
      enriched: undefined,
    };
  }

  const displayName = getObjectDisplayName(draft.type, result.data.properties);
  return {
    ...draft,
    name: displayName || draft.name,
    enriched: result.data,
  };
}
