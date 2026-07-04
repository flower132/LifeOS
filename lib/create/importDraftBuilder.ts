import { LifeObjectType, LIFE_OBJECT_TYPES } from "@/lib/types";
import { CreationDraft, createDraftId } from "./draftUtils";
import { ImportClassifiedRow, RawRecord } from "./importTypes";

function findNameColumnKey(cells: Record<string, string>): string | undefined {
  const keys = Object.keys(cells);
  const priority = [
    "name",
    "姓名",
    "名称",
    "内容",
    "content",
    "title",
    "标题",
  ];
  for (const candidate of priority) {
    const found = keys.find(
      (k) => k.toLowerCase().trim() === candidate.toLowerCase()
    );
    if (found) return found;
  }
  return keys[0];
}

function findTypeColumnKey(cells: Record<string, string>): string | undefined {
  const keys = Object.keys(cells);
  const priority = ["type", "类型", "kind", "category", "分类"];
  for (const candidate of priority) {
    const found = keys.find(
      (k) => k.toLowerCase().trim() === candidate.toLowerCase()
    );
    if (found) return found;
  }
  return undefined;
}

function normalizeType(value: string): LifeObjectType | undefined {
  const lower = value.toLowerCase().trim();
  return LIFE_OBJECT_TYPES.find((type) => type.toLowerCase() === lower
  );
}

export interface ImportDraftBuildResult {
  drafts: CreationDraft[];
  mode: "single-column" | "name-type" | "auto";
  nameColumn: string;
  typeColumn?: string;
}

export function buildDraftsFromRecords(
  records: RawRecord[],
  classifiedRows?: ImportClassifiedRow[]
): ImportDraftBuildResult {
  if (records.length === 0) {
    return { drafts: [], mode: "auto", nameColumn: "" };
  }

  const sample = records[0].cells;
  const nameColumn = findNameColumnKey(sample) ?? "";
  const typeColumn = findTypeColumnKey(sample);

  // Name + Type mode.
  if (nameColumn && typeColumn) {
    const drafts = records.map((record) => {
      const name = record.cells[nameColumn] || "";
      const typeValue = record.cells[typeColumn] || "";
      const type = normalizeType(typeValue) || "knowledge";
      return {
        id: createDraftId(),
        type,
        name,
        selected: true,
      };
    });
    return { drafts, mode: "name-type", nameColumn, typeColumn };
  }

  // Single column mode.
  const keys = Object.keys(sample);
  if (keys.length === 1) {
    const drafts = records.map((record) => {
      const name = record.cells[keys[0]] || "";
      return {
        id: createDraftId(),
        type: "person" as LifeObjectType,
        name,
        selected: true,
      };
    });
    return { drafts, mode: "single-column", nameColumn: keys[0] };
  }

  // Auto mode with AI classification.
  const classificationMap = new Map(
    classifiedRows?.map((r) => [r.id, r])
  );
  const drafts = records.map((record) => {
    const classified = classificationMap.get(record.id);
    const name = classified?.name || record.cells[nameColumn] || "";
    const type = classified?.typeGuess || "knowledge";
    return {
      id: createDraftId(),
      type,
      name,
      selected: true,
    };
  });
  return { drafts, mode: "auto", nameColumn };
}

export function updateDraftsDefaultType(
  drafts: CreationDraft[],
  type: LifeObjectType
): CreationDraft[] {
  return drafts.map((draft) => ({ ...draft, type }));
}
