import { And, FindOperator, LessThan, MoreThanOrEqual } from 'typeorm';

/** Condition covering `from` (inclusive) to `to` (exclusive), or undefined when neither is given. */
function within(from?: Date, to?: Date): FindOperator<Date> | undefined {
  if (from && to) return And(MoreThanOrEqual(from), LessThan(to));
  if (from) return MoreThanOrEqual(from);
  if (to) return LessThan(to);
  return undefined;
}

/**
 * Where condition on `startedAt` covering `from` (inclusive) to `to` (exclusive), to spread into a `where`.
 * Empty when neither is given, as TypeORM rejects a condition with an undefined value.
 */
export function startedWithin(from?: Date, to?: Date): { startedAt?: FindOperator<Date> } {
  const condition = within(from, to);
  return condition ? { startedAt: condition } : {};
}

/** Like `startedWithin`, for `takenAt`. */
export function takenWithin(from?: Date, to?: Date): { takenAt?: FindOperator<Date> } {
  const condition = within(from, to);
  return condition ? { takenAt: condition } : {};
}
