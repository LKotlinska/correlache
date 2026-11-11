import { Exercise } from '../../../models/workout.model';
import { NameMatch } from './exercise-matching';
import { ImportedSet, ImportedWorkout } from './imported-workout';
import {
  buildWorkoutPayloads,
  initialChoices,
  NameChoice,
  summarise,
  undecidedNames,
} from './import-plan';

const exercise = (id: number, name: string): Exercise => ({
  id,
  name,
  imageName: null,
  gifName: null,
  equipment: { id: 1, name: 'any' },
  bodyPart: { id: 1, name: 'any' },
  muscles: [],
});

const plank = exercise(1, 'front plank');
const curl = exercise(2, 'dumbbell biceps curl');
const press = exercise(3, 'dumbbell incline bench press');
const pressBarbell = exercise(4, 'barbell incline bench press');

const set = (values: Partial<ImportedSet>): ImportedSet => ({
  weight: null,
  reps: null,
  distance: null,
  durationSeconds: null,
  warmup: false,
  ...values,
});

const workout = (startedAt: string, exercises: [string, ImportedSet[]][]): ImportedWorkout => ({
  title: 'Lower B',
  startedAt,
  durationSeconds: 3600,
  exercises: exercises.map(([name, sets]) => ({ name, trackingMode: 'reps', sets })),
});

const chosen = (exercise: Exercise): NameChoice => ({ kind: 'exercise', exercise });
const skip: NameChoice = { kind: 'skip' };

describe('initialChoices', () => {
  const matches: NameMatch[] = [
    { name: 'Biceps Curl', setCount: 3, match: { kind: 'matched', exercise: curl } },
    {
      name: 'Incline Bench Press',
      setCount: 3,
      match: { kind: 'choose', options: [press, pressBarbell] },
    },
    { name: 'Run on Treadmill', setCount: 1, match: { kind: 'unmatched' } },
  ];

  it('takes the automatic matches and leaves the rest undecided', () => {
    const choices = initialChoices(matches);
    expect([...choices]).toEqual([['Biceps Curl', chosen(curl)]]);
    expect(undecidedNames(matches, choices).map((m) => m.name)).toEqual([
      'Incline Bench Press',
      'Run on Treadmill',
    ]);
  });

  it('keeps earlier choices, including changes to automatic matches', () => {
    const previous = new Map([
      ['Biceps Curl', skip],
      ['Run on Treadmill', skip],
      ['Gone From The File', skip],
    ]);
    expect([...initialChoices(matches, previous)]).toEqual([
      ['Biceps Curl', skip],
      ['Run on Treadmill', skip],
    ]);
  });
});

describe('summarise', () => {
  it('counts workouts, sets and warmups and gives the date range', () => {
    expect(
      summarise([
        workout('2026-08-02T11:33:11', [
          ['Front Plank', [set({ durationSeconds: 60, warmup: true })]],
        ]),
        workout('2026-09-01T10:35:43', [['Biceps Curl', [set({ reps: 10 }), set({ reps: 8 })]]]),
      ]),
    ).toEqual({
      workouts: 2,
      sets: 3,
      warmupSets: 1,
      firstStartedAt: '2026-08-02T11:33:11',
      lastStartedAt: '2026-09-01T10:35:43',
    });
  });

  it('is null for a file without workouts', () => {
    expect(summarise([])).toBeNull();
  });
});

describe('buildWorkoutPayloads', () => {
  const choices = new Map<string, NameChoice>([
    ['Front Plank', chosen(plank)],
    ['Plank', chosen(plank)],
    ['Biceps Curl', chosen(curl)],
    ['Run on Treadmill', skip],
  ]);

  it('sends the start as UTC, read as local time', () => {
    const [payload] = buildWorkoutPayloads(
      [workout('2026-09-01T10:35:43', [['Biceps Curl', [set({ reps: 10 })]]])],
      choices,
      { includeWarmups: true },
    );
    expect(payload.startedAt).toBe(new Date(2026, 8, 1, 10, 35, 43).toISOString());
    expect(payload).toMatchObject({ title: 'Lower B', durationSeconds: 3600 });
    expect(payload.exercises).toEqual([
      {
        exerciseId: curl.id,
        trackingMode: 'reps',
        sets: [{ weight: null, reps: 10, distance: null, durationSeconds: null }],
      },
    ]);
  });

  it('leaves out skipped names and workouts left empty', () => {
    const payloads = buildWorkoutPayloads(
      [
        workout('2026-09-01T10:35:43', [['Run on Treadmill', [set({ durationSeconds: 1500 })]]]),
        workout('2026-09-02T10:35:43', [
          ['Run on Treadmill', [set({ durationSeconds: 1500 })]],
          ['Biceps Curl', [set({ reps: 10 })]],
        ]),
      ],
      choices,
      { includeWarmups: true },
    );
    expect(payloads).toHaveLength(1);
    expect(payloads[0].exercises.map((e) => e.exerciseId)).toEqual([curl.id]);
  });

  it('leaves out warmup sets unless they are wanted', () => {
    const imported = [
      workout('2026-09-01T10:35:43', [
        ['Front Plank', [set({ durationSeconds: 60, warmup: true }), set({ durationSeconds: 40 })]],
      ]),
    ];
    const sets = (includeWarmups: boolean) =>
      buildWorkoutPayloads(imported, choices, { includeWarmups })[0].exercises[0].sets.length;
    expect(sets(true)).toBe(2);
    expect(sets(false)).toBe(1);
  });

  it('merges names mapped to the same exercise into one entry', () => {
    const [payload] = buildWorkoutPayloads(
      [
        workout('2026-09-01T10:35:43', [
          ['Front Plank', [set({ durationSeconds: 60 })]],
          ['Biceps Curl', [set({ reps: 10 })]],
          ['Plank', [set({ durationSeconds: 45 })]],
        ]),
      ],
      choices,
      { includeWarmups: true },
    );
    expect(payload.exercises.map((e) => [e.exerciseId, e.sets.length])).toEqual([
      [plank.id, 2],
      [curl.id, 1],
    ]);
  });

  it('works out the tracking mode again from the sets that are kept', () => {
    // Only the warmup had a weight, so without it the curl is reps only
    const [payload] = buildWorkoutPayloads(
      [
        workout('2026-09-01T10:35:43', [
          ['Biceps Curl', [set({ weight: 2, reps: 15, warmup: true }), set({ reps: 10 })]],
        ]),
      ],
      choices,
      { includeWarmups: false },
    );
    expect(payload.exercises[0]).toMatchObject({
      trackingMode: 'reps',
      sets: [{ weight: null, reps: 10 }],
    });
  });
});
