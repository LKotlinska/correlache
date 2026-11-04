import { And, FindOperator, LessThan, MoreThanOrEqual } from 'typeorm';

/** Filter for a date column covering `from` (inclusive) to `to` (exclusive); undefined when neither is given. */
export function dateRange(from?: Date, to?: Date): FindOperator<Date> | undefined {
  if (from && to) return And(MoreThanOrEqual(from), LessThan(to));
  if (from) return MoreThanOrEqual(from);
  if (to) return LessThan(to);
  return undefined;
}
