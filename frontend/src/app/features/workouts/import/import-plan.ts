import { CreateWorkoutPayload, Exercise } from '../../../models/workout.model';
import { NameMatch } from './exercise-matching';
import { applyTrackingMode } from './group-sets';
import { ImportedSet, ImportedWorkout } from './imported-workout';

// What the user decided on the import screen, and the workouts that come out of it.

/** What to do with every set of one exported exercise name */
export type NameChoice = { kind: 'exercise'; exercise: Exercise } | { kind: 'skip' };

/** Keyed by exported name. A name without an entry has not been decided yet. */
export type NameChoices = ReadonlyMap<string, NameChoice>;

export interface ImportOptions {
  includeWarmups: boolean;
}

export interface ImportSummary {
  workouts: number;
  sets: number;
  warmupSets: number;
  /** Local start times of the oldest and newest workout */
  firstStartedAt: string;
  lastStartedAt: string;
}

/**
 * Starts from the automatic matches. Choices made earlier are kept for names that are still in the
 * file, so changing the units, which re-reads the file, does not undo the user's work.
 */
export function initialChoices(
  matches: NameMatch[],
  previous?: NameChoices,
): Map<string, NameChoice> {
  const choices = new Map<string, NameChoice>();
  for (const { name, match } of matches) {
    const earlier = previous?.get(name);
    if (earlier) choices.set(name, earlier);
    else if (match.kind === 'matched')
      choices.set(name, { kind: 'exercise', exercise: match.exercise });
  }
  return choices;
}

export function undecidedNames(matches: NameMatch[], choices: NameChoices): NameMatch[] {
  return matches.filter(({ name }) => !choices.has(name));
}

/** Null when the file has no workouts */
export function summarise(workouts: ImportedWorkout[]): ImportSummary | null {
  if (workouts.length === 0) return null;
  const sets = workouts.flatMap((workout) =>
    workout.exercises.flatMap((exercise) => exercise.sets),
  );
  return {
    workouts: workouts.length,
    sets: sets.length,
    warmupSets: sets.filter((set) => set.warmup).length,
    // parsers return workouts oldest first
    firstStartedAt: workouts[0].startedAt,
    lastStartedAt: workouts[workouts.length - 1].startedAt,
  };
}

/**
 * Turns the imported workouts into what POST /workout accepts. Leaves out skipped names, warmup sets
 * unless they are wanted, and exercises or workouts left with nothing in them. Names that are not
 * decided yet are left out too, so call this once every name has a choice.
 */
export function buildWorkoutPayloads(
  workouts: ImportedWorkout[],
  choices: NameChoices,
  options: ImportOptions,
): CreateWorkoutPayload[] {
  return workouts.flatMap((workout) => {
    const exercises = mergeByExercise(workout, choices, options).map(({ exerciseId, sets }) => {
      const tracked = applyTrackingMode(sets);
      return {
        exerciseId,
        trackingMode: tracked.trackingMode,
        sets: tracked.sets.map(toSetPayload),
      };
    });
    if (exercises.length === 0) return [];
    return [
      {
        title: workout.title,
        startedAt: localToIso(workout.startedAt),
        durationSeconds: workout.durationSeconds,
        exercises,
      },
    ];
  });
}

// Two exported names can be mapped to the same exercise, e.g. "Front Plank" and "Plank". The workout
// form keeps one entry per exercise, so their sets are merged, in the order the exercises were done.
function mergeByExercise(
  workout: ImportedWorkout,
  choices: NameChoices,
  { includeWarmups }: ImportOptions,
): { exerciseId: number; sets: ImportedSet[] }[] {
  const setsByExerciseId = new Map<number, ImportedSet[]>();
  for (const exercise of workout.exercises) {
    const choice = choices.get(exercise.name);
    if (choice?.kind !== 'exercise') continue;
    const sets = exercise.sets.filter((set) => includeWarmups || !set.warmup);
    if (sets.length === 0) continue;
    const id = choice.exercise.id;
    setsByExerciseId.set(id, [...(setsByExerciseId.get(id) ?? []), ...sets]);
  }
  return [...setsByExerciseId].map(([exerciseId, sets]) => ({ exerciseId, sets }));
}

function toSetPayload({ weight, reps, distance, durationSeconds }: ImportedSet) {
  return { weight, reps, distance, durationSeconds };
}

// "2026-11-09T10:53:09" is read as the browser's local time, and sent as UTC like the workout form does
function localToIso(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}
