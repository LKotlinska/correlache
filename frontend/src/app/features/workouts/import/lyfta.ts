import { CsvRow, parseCsv } from './csv';
import { groupIntoWorkouts, isEmptySet, SetRow } from './group-sets';
import {
  DEFAULT_IMPORT_UNITS,
  ImportFormatError,
  ImportParseResult,
  ImportProblem,
  ImportUnits,
} from './imported-workout';
import {
  parseClock,
  parseLocalDateTime,
  parseNumber,
  parseWholeNumber,
  requireText,
  requireValue,
  RowError,
  toKilograms,
  toKilometres,
} from './parse-values';

// Lyfta's export has one row per set and repeats the workout's details on every row:
//   Title,Date,Duration,Exercise,Superset id,Weight,Reps,Distance,Time,Set Type
//   Lower B,2026-11-09 10:53:09,01:08:27,Run on Treadmill ,,,,1.88,15:00,NORMAL_SET
// "Superset id" is not read because supersets are not stored.
const COLUMNS = [
  'Title',
  'Date',
  'Duration',
  'Exercise',
  'Weight',
  'Reps',
  'Distance',
  'Time',
  'Set Type',
] as const;

type LyftaRow = Record<(typeof COLUMNS)[number], string>;

/** True when the header has every column the parser reads. Extra or reordered columns are fine. */
export function isLyftaHeader(header: string[]): boolean {
  const names = new Set(header.map((name) => name.trim()));
  return COLUMNS.every((column) => names.has(column));
}

export function parseLyftaCsv(
  text: string,
  units: ImportUnits = DEFAULT_IMPORT_UNITS,
): ImportParseResult {
  const [header, ...rows] = parseCsv(text);
  if (!header || !isLyftaHeader(header.fields)) {
    throw new ImportFormatError('This file does not look like a Lyfta export.');
  }
  const readRow = rowReader(header.fields);

  const setRows: SetRow[] = [];
  const problems: ImportProblem[] = [];
  let emptySetsDropped = 0;

  for (const row of rows) {
    try {
      const setRow = toSetRow(readRow(row), units);
      if (isEmptySet(setRow.set)) emptySetsDropped++;
      else setRows.push(setRow);
    } catch (error) {
      if (!(error instanceof RowError)) throw error;
      problems.push({ line: row.line, message: error.message });
    }
  }

  return { workouts: groupIntoWorkouts(setRows), problems, emptySetsDropped };
}

// Looks values up by column name, so the column order in the file does not matter
function rowReader(header: string[]): (row: CsvRow) => LyftaRow {
  const indexByName = new Map(header.map((name, index) => [name.trim(), index]));
  return (row) =>
    Object.fromEntries(
      COLUMNS.map((column) => [column, (row.fields[indexByName.get(column)!] ?? '').trim()]),
    ) as LyftaRow;
}

function toSetRow(row: LyftaRow, units: ImportUnits): SetRow {
  return {
    workoutTitle: requireText(row.Title, 'workout title'),
    startedAt: parseLocalDateTime(row.Date, 'Date'),
    workoutDurationSeconds: requireValue(parseClock(row.Duration, 'Duration'), 'workout duration'),
    // Lyfta names often end in a space, e.g. "Run on Treadmill "
    exerciseName: requireText(row.Exercise.replace(/\s+/g, ' '), 'exercise name'),
    set: {
      weight: toKilograms(parseNumber(row.Weight, 'Weight'), units.weight),
      reps: parseWholeNumber(row.Reps, 'Reps'),
      distance: toKilometres(parseNumber(row.Distance, 'Distance'), units.distance),
      durationSeconds: parseClock(row.Time, 'Time'),
      // Failure, left and right sets are imported as ordinary sets
      warmup: row['Set Type'] === 'WARMUP_SET',
    },
  };
}
