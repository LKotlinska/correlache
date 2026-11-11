import { Exercise } from '../../../models/workout.model';
import { exerciseMatcher, matchExerciseNames } from './exercise-matching';
import { ImportedWorkout } from './imported-workout';

let nextId = 1;
const exercise = (name: string): Exercise => ({
  id: nextId++,
  name,
  imageName: null,
  gifName: null,
  equipment: { id: 1, name: 'any' },
  bodyPart: { id: 1, name: 'any' },
  muscles: [],
});

// Names from the exercises dataset the library is seeded from
const library = [
  'lever leg extension',
  'cable bar lateral pulldown',
  'cable straight arm pulldown',
  'barbell incline bench press',
  'dumbbell incline bench press',
  'ez barbell curl',
  'barbell curl',
  'weighted front plank',
  'lever chest press',
  'lever chest press',
].map(exercise);

const byName = (name: string) => library.filter((e) => e.name === name);

describe('exerciseMatcher', () => {
  const match = exerciseMatcher(library);

  it('matches the same name, ignoring case and spacing', () => {
    expect(match('Lever  Leg Extension ')).toEqual({
      kind: 'matched',
      exercise: byName('lever leg extension')[0],
    });
  });

  it('matches without a version suffix', () => {
    expect(match('Cable Straight Arm Pulldown (VERSION 2)')).toEqual({
      kind: 'matched',
      exercise: byName('cable straight arm pulldown')[0],
    });
  });

  it('matches with the equipment word added in front', () => {
    expect(match('Bar Lateral Pulldown')).toEqual({
      kind: 'matched',
      exercise: byName('cable bar lateral pulldown')[0],
    });
  });

  it('offers a choice when several equipment types fit', () => {
    expect(match('Incline Bench Press')).toEqual({
      kind: 'choose',
      options: [
        ...byName('barbell incline bench press'),
        ...byName('dumbbell incline bench press'),
      ],
    });
  });

  it('offers a choice when the library has the name twice', () => {
    expect(match('Lever Chest Press')).toEqual({
      kind: 'choose',
      options: byName('lever chest press'),
    });
  });

  it('prefers the name as it is over adding equipment', () => {
    // "barbell curl" exists, so "ez barbell curl" is not offered for it
    expect(match('Barbell Curl')).toEqual({ kind: 'matched', exercise: byName('barbell curl')[0] });
  });

  it('does not treat "weighted" as equipment', () => {
    expect(match('Front Plank')).toEqual({ kind: 'unmatched' });
  });

  it('leaves unknown names unmatched', () => {
    expect(match('Run on Treadmill')).toEqual({ kind: 'unmatched' });
  });
});

describe('matchExerciseNames', () => {
  const workout = (exercises: [string, number][]): ImportedWorkout => ({
    title: 'Upper A',
    startedAt: '2026-10-12T09:56:14',
    durationSeconds: 3600,
    exercises: exercises.map(([name, setCount]) => ({
      name,
      trackingMode: 'reps',
      sets: Array.from({ length: setCount }, () => ({
        weight: null,
        reps: 10,
        distance: null,
        durationSeconds: null,
        warmup: false,
      })),
    })),
  });

  it('lists each name once with its sets across workouts, most used first', () => {
    const matches = matchExerciseNames(
      [
        workout([
          ['Run on Treadmill', 1],
          ['Bar Lateral Pulldown', 3],
        ]),
        workout([
          ['Bar Lateral Pulldown', 3],
          ['Lever Leg Extension', 1],
        ]),
      ],
      library,
    );
    expect(matches.map(({ name, setCount, match }) => [name, setCount, match.kind])).toEqual([
      ['Bar Lateral Pulldown', 6, 'matched'],
      ['Lever Leg Extension', 1, 'matched'],
      ['Run on Treadmill', 1, 'unmatched'],
    ]);
  });
});
