import { addDays, monthStart, startOfWeek, weekStarts } from '../../utils/date';

/** The last `count` calendar weeks or months, including the current one. */
export interface Period {
  unit: 'week' | 'month';
  count: number;
}

/** First day of the period: the first of its oldest month, or the Monday of its oldest week. */
export function periodStart({ unit, count }: Period): Date {
  return unit === 'month' ? monthStart(count - 1) : weekStarts(count)[0];
}

/** Monday of each week from the one holding the period's first day until this week, oldest first. */
export function periodWeeks(period: Period): Date[] {
  if (period.unit === 'week') return weekStarts(period.count);
  const now = new Date();
  const mondays: Date[] = [];
  for (let d = startOfWeek(periodStart(period)); d <= now; d = addDays(d, 7)) mondays.push(d);
  return mondays;
}

/** First day of each month from the one holding the period's first day until this month, oldest first. */
export function periodMonths(period: Period): Date[] {
  const start = periodStart(period);
  const now = new Date();
  const count = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1;
  return Array.from({ length: count }, (_, i) => monthStart(count - 1 - i));
}

/** e.g. "the last 3 months". */
export function periodLabel({ unit, count }: Period): string {
  return `the last ${count} ${unit}s`;
}
