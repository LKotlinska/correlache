/**
 * Merges the calendar day of `date` with the clock time of `time`
 * and returns an ISO 8601 string (UTC, with timezone) as the backend expects.
 * If `time` is missing, midnight local time is used.
 */
export function combineDateTime(date: Date, time: Date | null): string {
  const combined = new Date(date);
  if (time) {
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  } else {
    combined.setHours(0, 0, 0, 0);
  }
  return combined.toISOString();
}
