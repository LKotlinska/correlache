import { DistanceUnit, WeightUnit } from './imported-workout';

// Readers for single CSV values, shared by the app-specific parsers. Each throws a RowError with
// a message the user can act on when the value cannot be read.

/** A value in one row could not be read. That row is skipped and the rest of the file still imports. */
export class RowError extends Error {}

const KG_PER_LB = 0.45359237;
const KM_PER_MILE = 1.609344;

/** True for a field with no value. Some apps write the word "null" instead of leaving it empty. */
export function isBlank(value: string): boolean {
  return value === '' || value === 'null';
}

export function requireText(value: string, label: string): string {
  if (isBlank(value)) throw new RowError(`The ${label} is missing.`);
  return value;
}

export function requireValue<T>(value: T | null, label: string): T {
  if (value === null) throw new RowError(`The ${label} is missing.`);
  return value;
}

export function parseNumber(value: string, label: string): number | null {
  if (isBlank(value)) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RowError(`${label} "${value}" is not a number of zero or more.`);
  }
  return number;
}

export function parseWholeNumber(value: string, label: string): number | null {
  const number = parseNumber(value, label);
  if (number !== null && !Number.isInteger(number)) {
    throw new RowError(`${label} "${value}" is not a whole number.`);
  }
  return number;
}

/** Reads "01:08:27" as hours:minutes:seconds and "27:00" or "0:50" as minutes:seconds. Returns seconds. */
export function parseClock(value: string, label: string): number | null {
  if (isBlank(value)) return null;
  const parts = value.split(':');
  const [first, ...rest] = parts;
  const isClock =
    (parts.length === 2 || parts.length === 3) &&
    /^\d+$/.test(first) &&
    rest.every((part) => /^[0-5]\d$/.test(part));
  if (!isClock) throw new RowError(`${label} "${value}" is not a time like 1:05 or 01:05:30.`);
  return parts.reduce((seconds, part) => seconds * 60 + Number(part), 0);
}

/** Reads "2026-11-09 10:53:09" as the local time "2026-11-09T10:53:09". */
export function parseLocalDateTime(value: string, label: string): string {
  const match =
    /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])[ T]([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.exec(
      value,
    );
  if (!match) {
    throw new RowError(`${label} "${value}" is not a date and time like 2026-11-09 10:53:09.`);
  }
  const [, year, month, day, hour, minute, second] = match;
  if (Number(day) > daysInMonth(Number(year), Number(month))) {
    throw new RowError(`${label} "${value}" is not a real date.`);
  }
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export function toKilograms(weight: number | null, unit: WeightUnit): number | null {
  if (weight === null || unit === 'kg') return weight;
  return round(weight * KG_PER_LB, 2);
}

export function toKilometres(distance: number | null, unit: DistanceUnit): number | null {
  if (distance === null || unit === 'km') return distance;
  return round(distance * KM_PER_MILE, 3);
}

// Day 0 of the next month is the last day of this one. Months are 1-based here.
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
