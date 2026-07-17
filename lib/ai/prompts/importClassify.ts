import { Language } from "@/lib/i18n";
import { LIFE_OBJECT_TYPES } from "@/lib/types";
import { RawRecord } from "@/lib/create/importTypes";

/**
 * IMPORT_CLASSIFY task prompt — classify imported spreadsheet rows.
 */
export function buildClassificationPrompt(
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
