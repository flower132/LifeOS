import * as XLSX from "xlsx";
import { generateId } from "@/lib/id";
import { ImportParseResult, RawRecord } from "./importTypes";

const SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : "";
}

function isSupportedFile(filename: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(getFileExtension(filename));
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function decodeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // Try UTF-8 first.
  try {
    const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return utf8;
  } catch {
    // Fall back to GBK.
    try {
      const gbk = new TextDecoder("gbk", { fatal: true }).decode(bytes);
      return gbk;
    } catch {
      throw new Error("encoding_error");
    }
  }
}

function normalizeHeader(header: unknown): string {
  if (header === null || header === undefined) return "";
  return String(header).trim();
}

function normalizeCell(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  return String(cell).trim();
}

function parseWorksheet(worksheet: XLSX.WorkSheet): ImportParseResult {
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

  if (json.length === 0) {
    return { records: [], headers: [], empty: true };
  }

  // First non-empty row as headers if any cell looks like a header.
  const firstRow = json[0].map(normalizeHeader);
  const hasHeader = firstRow.some(
    (h) =>
      h.length > 0 &&
      !/^\d+$/.test(h) &&
      (h.toLowerCase().includes("name") ||
        h.toLowerCase().includes("type") ||
        h.toLowerCase().includes("姓名") ||
        h.toLowerCase().includes("类型") ||
        h.toLowerCase().includes("内容") ||
        h.toLowerCase().includes("名称"))
  );

  const headers = hasHeader ? firstRow : firstRow.map((_, i) => `Column ${i + 1}`);
  const dataRows = hasHeader ? json.slice(1) : json;

  const records: RawRecord[] = dataRows
    .map((row, index) => {
      const cells: Record<string, string> = {};
      headers.forEach((header, colIndex) => {
        cells[header] = normalizeCell(row[colIndex]);
      });
      return {
        id: `row-${generateId()}`,
        rowIndex: hasHeader ? index + 2 : index + 1,
        cells,
      };
    })
    .filter((record) => Object.values(record.cells).some((v) => v.length > 0)
    );

  return {
    records,
    headers,
    empty: records.length === 0,
  };
}

export interface ImportParseError {
  code:
    | "wrong_format"
    | "too_large"
    | "empty_file"
    | "no_data"
    | "encoding_error"
    | "read_error";
  message: string;
}

export async function parseImportFile(file: File): Promise<ImportParseResult> {
  if (!isSupportedFile(file.name)) {
    throw { code: "wrong_format", message: "Unsupported file format" } as ImportParseError;
  }

  if (file.size > MAX_FILE_SIZE) {
    throw { code: "too_large", message: "File exceeds 5MB limit" } as ImportParseError;
  }

  if (file.size === 0) {
    throw { code: "empty_file", message: "File is empty" } as ImportParseError;
  }

  const ext = getFileExtension(file.name);
  const buffer = await readFileAsArrayBuffer(file);

  try {
    let workbook: XLSX.WorkBook;

    if (ext === ".csv") {
      const text = decodeBuffer(buffer);
      workbook = XLSX.read(text, { type: "string" });
    } else {
      workbook = XLSX.read(buffer, { type: "array" });
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw { code: "no_data", message: "No worksheet found" } as ImportParseError;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const result = parseWorksheet(worksheet);

    if (result.empty) {
      throw { code: "no_data", message: "No importable data found" } as ImportParseError;
    }

    return result;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err) {
      throw err;
    }
    if (err instanceof Error && err.message === "encoding_error") {
      throw { code: "encoding_error", message: "Encoding detection failed" } as ImportParseError;
    }
    throw { code: "read_error", message: "Failed to parse file" } as ImportParseError;
  }
}

export function isImportFileSupported(filename: string): boolean {
  return isSupportedFile(filename);
}

export { SUPPORTED_EXTENSIONS };
