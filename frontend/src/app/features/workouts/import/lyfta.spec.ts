import { ImportFormatError } from './imported-workout';
import { isLyftaHeader, parseLyftaCsv } from './lyfta';

const HEADER = 'Title,Date,Duration,Exercise,Superset id,Weight,Reps,Distance,Time,Set Type';

// Trimmed from a real Lyfta export. Newest workout first, as Lyfta writes them.
const EXPORT = [
  HEADER,
  'Lower B,2026-09-01 10:35:43,01:12:13,Run on Treadmill ,,,,,25:00,NORMAL_SET',
  'Lower B,2026-09-01 10:35:43,01:12:13,Lying Leg Raise,,0.000,20,,,NORMAL_SET',
  'Lower B,2026-09-01 10:35:43,01:12:13,Dumbbell Plank Pass Through,,8.000,12,,,FAILURE_SET',
  'Lower B,2026-09-01 10:35:43,01:12:13,Reverse Plank,,,,,0:37,NORMAL_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Run on Treadmill ,,,,3.15,25:00,NORMAL_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Front Plank,,null,,,1:00,WARMUP_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Front Plank,,null,,,0:40,NORMAL_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Straight Leg Kickback ,,0.000,20,,,LEFT_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Straight Leg Kickback ,,0.000,20,,,RIGHT_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Incline Bench Press,,8.000,12,,,NORMAL_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Incline Bench Press,,0.000,10,,,NORMAL_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Triceps Pushdown,1,8.750,12,,,NORMAL_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Dumbbell Plank Pass Through,,,,,,FAILURE_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Dumbbell Plank Pass Through,,,,,,FAILURE_SET',
  'Lower A,2026-08-05 11:50:01,01:14:31,Cable Straight Arm Pulldown (VERSION 2),,50.160,10,,,NORMAL_SET',
  'Lower B,2026-08-03 13:56:32,00:24:50,Run on Treadmill ,,,,2.68,22:00,NORMAL_SET',
].join('\n');

const set = (
  fields: Partial<Record<'weight' | 'reps' | 'distance' | 'durationSeconds', number>>,
  warmup = false,
) => ({
  weight: null,
  reps: null,
  distance: null,
  durationSeconds: null,
  ...fields,
  warmup,
});

describe('parseLyftaCsv', () => {
  const { workouts, problems, emptySetsDropped } = parseLyftaCsv(EXPORT);
  const workout = (startedAt: string) => workouts.find((w) => w.startedAt === startedAt)!;
  const exercise = (startedAt: string, name: string) =>
    workout(startedAt).exercises.find((e) => e.name === name)!;

  it('groups rows into workouts by start and title, oldest first', () => {
    expect(problems).toEqual([]);
    expect(workouts.map((w) => [w.title, w.startedAt, w.durationSeconds])).toEqual([
      ['Lower B', '2026-08-03T13:56:32', 24 * 60 + 50],
      ['Lower A', '2026-08-05T11:50:01', 3600 + 14 * 60 + 31],
      ['Lower B', '2026-09-01T10:35:43', 3600 + 12 * 60 + 13],
    ]);
  });

  it('keeps the exercise order and tidies the names', () => {
    expect(workout('2026-08-05T11:50:01').exercises.map((e) => e.name)).toEqual([
      'Run on Treadmill',
      'Front Plank',
      'Straight Leg Kickback',
      'Incline Bench Press',
      'Triceps Pushdown',
      'Cable Straight Arm Pulldown (VERSION 2)',
    ]);
  });

  it('reads a run with distance as time and distance', () => {
    expect(exercise('2026-08-05T11:50:01', 'Run on Treadmill')).toEqual({
      name: 'Run on Treadmill',
      trackingMode: 'duration_distance',
      sets: [set({ distance: 3.15, durationSeconds: 1500 })],
    });
  });

  it('reads a run without distance as time only', () => {
    const run = exercise('2026-09-01T10:35:43', 'Run on Treadmill');
    expect(run.trackingMode).toBe('duration');
    expect(run.sets).toEqual([set({ durationSeconds: 1500 })]);
  });

  it('reads a plank logged with a "null" weight as time only, marking the warmup', () => {
    const plank = exercise('2026-08-05T11:50:01', 'Front Plank');
    expect(plank.trackingMode).toBe('duration');
    expect(plank.sets).toEqual([set({ durationSeconds: 60 }, true), set({ durationSeconds: 40 })]);
  });

  it('reads reps logged with weight 0 as reps only', () => {
    const raise = exercise('2026-09-01T10:35:43', 'Lying Leg Raise');
    expect(raise.trackingMode).toBe('reps');
    expect(raise.sets).toEqual([set({ reps: 20 })]);
  });

  it('keeps a weight of 0 when other sets of the exercise have weight', () => {
    const press = exercise('2026-08-05T11:50:01', 'Incline Bench Press');
    expect(press.trackingMode).toBe('weight_reps');
    expect(press.sets).toEqual([set({ weight: 8, reps: 12 }), set({ weight: 0, reps: 10 })]);
  });

  it('keeps left and right sets as separate sets', () => {
    expect(exercise('2026-08-05T11:50:01', 'Straight Leg Kickback').sets).toEqual([
      set({ reps: 20 }),
      set({ reps: 20 }),
    ]);
  });

  it('drops sets with no values, and exercises left with none', () => {
    expect(emptySetsDropped).toBe(2);
    expect(exercise('2026-08-05T11:50:01', 'Dumbbell Plank Pass Through')).toBeUndefined();
    expect(exercise('2026-09-01T10:35:43', 'Dumbbell Plank Pass Through').sets).toEqual([
      set({ weight: 8, reps: 12 }),
    ]);
  });

  it('converts pounds and miles', () => {
    const converted = parseLyftaCsv(EXPORT, { weight: 'lb', distance: 'mi' });
    const at = converted.workouts.find((w) => w.startedAt === '2026-08-05T11:50:01')!;
    expect(at.exercises.find((e) => e.name === 'Triceps Pushdown')!.sets[0].weight).toBe(3.97);
    expect(at.exercises.find((e) => e.name === 'Run on Treadmill')!.sets[0].distance).toBe(5.069);
  });

  it('rejects a file that is not a Lyfta export', () => {
    expect(() => parseLyftaCsv('Date;Workout Name;Duration\n')).toThrow(ImportFormatError);
    expect(() => parseLyftaCsv('')).toThrow(ImportFormatError);
  });

  it('reports unreadable rows by line and imports the rest', () => {
    const result = parseLyftaCsv(
      [
        HEADER,
        'Upper A,2026-08-10 10:45:39,01:09:46,Biceps Curl,,3.000,10,,,NORMAL_SET',
        'Upper A,10/08/2026,01:09:46,Biceps Curl,,3.000,10,,,NORMAL_SET',
        'Upper A,2026-02-30 10:45:39,01:09:46,Biceps Curl,,3.000,10,,,NORMAL_SET',
        'Upper A,2026-08-10 10:45:39,01:09:46,Biceps Curl,,heavy,10,,,NORMAL_SET',
        'Upper A,2026-08-10 10:45:39,01:09:46,Biceps Curl,,3.000,7.5,,,NORMAL_SET',
        'Upper A,2026-08-10 10:45:39,01:09:46,Front Plank,,,,,1:75,NORMAL_SET',
        'Upper A,2026-08-10 10:45:39,,Biceps Curl,,3.000,10,,,NORMAL_SET',
        ',2026-08-10 10:45:39,01:09:46,Biceps Curl,,3.000,10,,,NORMAL_SET',
      ].join('\n'),
    );
    expect(result.problems.map((p) => p.line)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(result.problems[0].message).toContain('10/08/2026');
    expect(result.workouts).toHaveLength(1);
    expect(result.workouts[0].exercises[0].sets).toEqual([set({ weight: 3, reps: 10 })]);
  });
});

describe('isLyftaHeader', () => {
  it('accepts the columns in any order, with extra columns', () => {
    expect(isLyftaHeader(HEADER.split(','))).toBe(true);
    expect(isLyftaHeader([...HEADER.split(',').reverse(), 'RPE'])).toBe(true);
  });

  it('rejects a header missing a column', () => {
    expect(isLyftaHeader(HEADER.split(',').filter((c) => c !== 'Time'))).toBe(false);
  });
});
