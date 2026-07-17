import { Language } from "@/lib/i18n";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { AIStructuredGenerationRequest } from "@/lib/ai/types";
import { buildClassificationPrompt } from "@/lib/ai/prompts/importClassify";
import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  ImportClassifiedRow,
  ImportClassificationResult,
  RawRecord,
} from "@/lib/create/importTypes";

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

function parseClassificationResult(raw: unknown): ImportClassificationResult {
  const data = (raw ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(data.rows) ? data.rows : [];

  const validRows: ImportClassifiedRow[] = rows
    .map((item: unknown) => {
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : "";
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const typeGuess = typeof row.typeGuess === "string" ? row.typeGuess : "";
      const reason = typeof row.reason === "string" ? row.reason.trim() : "";

      if (!id || !name) return null;
      if (!LIFE_OBJECT_TYPES.includes(typeGuess as LifeObjectType)) {
        return {
          id,
          name,
          typeGuess: "knowledge" as LifeObjectType,
          reason: reason || "Unable to determine type, default to knowledge",
        };
      }
      return {
        id,
        name,
        typeGuess: typeGuess as LifeObjectType,
        reason,
      };
    })
    .filter((row): row is ImportClassifiedRow => row !== null);

  return { rows: validRows };
}

function buildMockClassificationResult(records: RawRecord[]): ImportClassificationResult {
  const typeCycle: LifeObjectType[] = [
    "person",
    "goal",
    "project",
    "knowledge",
    "event",
    "idea",
    "self",
  ];
  return {
    rows: records.map((record, index) => {
      const firstCell = Object.values(record.cells)[0] || "Imported item";
      return {
        id: record.id,
        name: firstCell,
        typeGuess: typeCycle[index % typeCycle.length],
        reason: "Local mock classification",
      };
    }),
  };
}

export async function classifyImportRecords(
  records: RawRecord[],
  options: { forceMock?: boolean } = {}
): Promise<ImportClassificationResult> {
  if (records.length === 0) {
    return { rows: [] };
  }

  const selected = selectProviderForTask("IMPORT_CLASSIFY", {
    forceMock: options.forceMock,
  });

  if (selected.isMock) {
    return buildMockClassificationResult(records);
  }

  const language = getLanguage();
  const prompt = buildClassificationPrompt(records, language);
  const request: AIStructuredGenerationRequest = {
    prompt,
    images: undefined,
    schemaHint:
      '{"rows":[{"id":"string","name":"string","typeGuess":"string","reason":"string"}]}',
  };

  // Server calls are logged centrally by the /api/ai client proxy.
  const text = await selected.provider.generateStructuredObject(request);
  const parsed = JSON.parse(text.trim());
  return parseClassificationResult(parsed);
}
