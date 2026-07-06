export function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isNonEmptyArray<T>(value: T[] | undefined | null): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function isDirtyObject(values: Record<string, unknown>): boolean {
  return Object.values(values).some((v) => {
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null) return Object.keys(v).length > 0;
    return Boolean(v);
  });
}
