import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { combineDateTime } from './combine-date-time';
import { isSameDay } from './date';

/** Combines the date and time controls into ISO strings. A same-day end with no end time uses the start time, not midnight. */
export function buildTimestamps(
  startDate: Date,
  startTime: Date | null,
  endDate: Date | null,
  endTime: Date | null,
) {
  const startedAt = combineDateTime(startDate, startTime);
  if (!endDate) {
    return { startedAt, endedAt: undefined };
  }
  const resolvedEndTime = !endTime && isSameDay(startDate, endDate) ? startTime : endTime;
  return { startedAt, endedAt: combineDateTime(endDate, resolvedEndTime) };
}

/**
 * Reads startDate/startTime and the optional endDate/endTime controls of a group.
 * Returns null while the start is incomplete.
 */
function readTimestamps(group: AbstractControl) {
  const startDate: Date | null = group.get('startDate')?.value ?? null;
  const startTime: Date | null = group.get('startTime')?.value ?? null;
  if (!startDate || !startTime) {
    return null;
  }
  const endDate: Date | null = group.get('endDate')?.value ?? null;
  const endTime: Date | null = group.get('endTime')?.value ?? null;
  return buildTimestamps(startDate, startTime, endDate, endTime);
}

/** Group validator: the combined end datetime must not be before the combined start datetime. */
export const endNotBeforeStart: ValidatorFn = (group): ValidationErrors | null => {
  const timestamps = readTimestamps(group);
  if (!timestamps?.endedAt) {
    return null;
  }
  return new Date(timestamps.endedAt) < new Date(timestamps.startedAt) ? { endBeforeStart: true } : null;
};

/** Group validator: neither the start nor the end datetime may be in the future (the date picker only blocks future days, not later times today). */
export const notInFuture: ValidatorFn = (group): ValidationErrors | null => {
  const timestamps = readTimestamps(group);
  if (!timestamps) {
    return null;
  }
  const now = Date.now();
  const { startedAt, endedAt } = timestamps;
  return new Date(startedAt).getTime() > now || (endedAt && new Date(endedAt).getTime() > now)
    ? { futureDate: true }
    : null;
};
