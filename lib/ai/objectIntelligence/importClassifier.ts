import { Language } from "@/lib/i18n";
import { addAILog } from "@/lib/ai/logs";
import { selectProviderForAnalysis } from "@/lib/ai/objectIntelligence/fallback";
import { AIStructuredGenerationRequest } from "@/lib/ai/types";
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

function buildClassificationPrompt(
  records: RawRecord[],
  language: Language
): string {
  const typeList = LIFE_OBJECT_TYPES.join(", ");
  const rowsJson = JSON.stringify(
    records.map((r) => ({ id: r.id, cells: r.cells })),
    null,
    2
  );

  const shape = JSON.stringify(
    {
      rows: [
        {
          id: "string: the same id from input",
          name: "string: the display name of this object",
          typeGuess: `one of: ${typeList}`,
          reason: "string: brief reason for the classification",
        },
      ],
    },
    null,
    2
  );

  const langHint =
    language === "zh" ? "请使用简体中文回复。" : "Please respond in English.";

  return `你是一位数据分类助手。用户从 Excel 或 CSV 导入了一些行，每行包含若干单元格。

请根据每行的内容，判断它最可能属于哪种 LifeOS 对象类型。typeGuess 必须是以下之一：${typeList}。

输入数据：
${rowsJson}

请输出 ONLY 一个合法的 JSON 对象，严格匹配以下结构：
${shape}

规则：
1. 返回的 rows 数组必须与输入行数相同，id 必须对应。
2. name 应该是这行数据最合适的显示名称（例如联系人的姓名、目标的名称、项目的名称）。
3. typeGuess 必须基于内容判断，不要编造。
4. 如果一行明显是地点，但 place 类型不可用，请选择 knowledge 或让用户后续手动修改。
5. 如果无法判断，默认使用 knowledge。
${langHint}`;
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

  const selected = options.forceMock
    ? {
        provider: selectProviderForAnalysis({
          provider: "mock",
          apiKey: "",
          baseUrl: "",
          model: "mock",
        }),
        isMock: true,
      }
    : { provider: selectProviderForAnalysis(), isMock: false };

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

  const start = performance.now();
  try {
    const text = await selected.provider.provider.generateStructuredObject(request);
    const durationMs = Math.round(performance.now() - start);
    const parsed = JSON.parse(text.trim());

    addAILog({
      provider: selected.provider.providerId,
      model: selected.provider.model,
      durationMs,
      status: "success",
    });

    return parseClassificationResult(parsed);
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    addAILog({
      provider: selected.provider.providerId,
      model: selected.provider.model,
      durationMs,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
