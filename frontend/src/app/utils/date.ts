const LOCALE = 'en-GB';

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** True when `day` falls on or after the calendar day of `start`, ignoring the time of day. */
export function isOnOrAfterDay(day: Date, start: Date): boolean {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const compared = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  return compared >= startDay;
}

/** Midnight on the Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Local calendar day as `YYYY-MM-DD`, for grouping. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "Today", "Yesterday", or a short date such as "Mon, 28 Oct". */
export function dayLabel(date: Date, now = new Date()): string {
  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, addDays(now, -1))) return 'Yesterday';
  return date.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "14:05". */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

/** "20 – 26 Oct" for the week starting at `monday`. */
export function weekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const short = (d: Date) => d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
  return `${short(monday)} – ${short(sunday)}`;
}

/** Query params for an optional `from`/`to` range as ISO strings, and an optional `limit`. */
export function dateRangeParams({ from, to, limit }: { from?: Date; to?: Date; limit?: number }): Record<string, string> {
  const params: Record<string, string> = {};
  if (limit) params['limit'] = String(limit);
  if (from) params['from'] = from.toISOString();
  if (to) params['to'] = to.toISOString();
  return params;
}

/** Latest selectable time for a date: now, but only when that date is today. */
export function maxTimeFor(date: Date | null): Date | null {
  const now = new Date();
  return date && isSameDay(date, now) ? now : null;
}

/** First day of the month `monthsAgo` months before the current one, e.g. 0 for this month. */
export function monthStart(monthsAgo: number, now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
}
