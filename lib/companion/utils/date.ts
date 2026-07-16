export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getISOWeekKey(date = new Date()): string {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getISOWeekBounds(
  weekKey: string
): { from: string; to: string } | null {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  if (week < 1 || week > 53) return null;

  // ISO 8601: week 1 contains the first Thursday of the year.
  // Monday of week N = Jan 4 + (N - 1) weeks.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4.getTime() - (jan4Day - 1) * 86400000 + (week - 1) * 7 * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);

  const from = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(Date.UTC(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate()));
  to.setUTCHours(23, 59, 59, 999);

  return { from: from.toISOString(), to: to.toISOString() };
}

export function getMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getMonthBounds(
  monthKey: string
): { from: string; to: string } | null {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;

  const from = new Date(Date.UTC(year, month - 1, 1));
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(Date.UTC(year, month, 0));
  to.setUTCHours(23, 59, 59, 999);

  return { from: from.toISOString(), to: to.toISOString() };
}

export function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA).getTime();
  const b = new Date(isoB).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs(a - b) / msPerDay);
}

export function isSameLocalDay(isoA: string, isoB: string): boolean {
  return getLocalDateString(new Date(isoA)) === getLocalDateString(new Date(isoB));
}
