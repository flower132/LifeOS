import { LifeObjectType } from "@/lib/types";

export interface RawRecord {
  id: string;
  rowIndex: number;
  cells: Record<string, string>;
}

export interface ImportParseResult {
  records: RawRecord[];
  headers: string[];
  empty: boolean;
}

export interface ImportClassifiedRow {
  id: string;
  name: string;
  typeGuess: LifeObjectType;
  reason: string;
}

export interface ImportClassificationResult {
  rows: ImportClassifiedRow[];
}
