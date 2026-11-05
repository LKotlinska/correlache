import { And, FindOperator, LessThan, MoreThanOrEqual } from 'typeorm';

/**
 * Where condition on `startedAt` covering `from` (inclusive) to `to` (exclusive), to spread into a `where`.
 * Empty when neither is given, as TypeORM rejects a condition with an undefined value.
 */
export function startedWithin(from?: Date, to?: Date): { startedAt?: FindOperator<Date> } {
  if (from && to) return { startedAt: And(MoreThanOrEqual(from), LessThan(to)) };
  if (from) return { startedAt: MoreThanOrEqual(from) };
  if (to) return { startedAt: LessThan(to) };
  return {};
}
