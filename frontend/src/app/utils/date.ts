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

/** Latest selectable time for a date: now, but only when that date is today. */
export function maxTimeFor(date: Date | null): Date | null {
  const now = new Date();
  return date && isSameDay(date, now) ? now : null;
}
