import { Exercise } from '../../../models/workout.model';
import { ImportedWorkout } from './imported-workout';

/** How an exported exercise name relates to the exercise library. */
export type ExerciseMatch =
  | { kind: 'matched'; exercise: Exercise }
  /** Several exercises fit equally well, e.g. "Incline Bench Press" with a barbell or dumbbells */
  | { kind: 'choose'; options: Exercise[] }
  | { kind: 'unmatched' };

export interface NameMatch {
  /** As written in the export */
  name: string;
  /** Across all imported workouts, so the overview can put the most used names first */
  setCount: number;
  match: ExerciseMatch;
}

// Words library names start with to say which equipment is used, e.g. "cable bar lateral pulldown".
// Some apps leave them out ("Bar Lateral Pulldown"). Longer prefixes come first so "ez barbell"
// is not read as "barbell". "weighted" is left out on purpose: it names a different exercise
// ("weighted front plank"), not the equipment for the same one.
const EQUIPMENT_PREFIXES = [
  'olympic barbell',
  'resistance band',
  'ez barbell',
  'trap bar',
  'barbell',
  'dumbbell',
  'kettlebell',
  'cable',
  'lever',
  'smith',
  'sled',
  'band',
];

// Lyfta marks alternative versions of an exercise, e.g. "Cable Straight Arm Pulldown (VERSION 2)"
const VERSION_SUFFIX = /\s*\(version \d+\)$/;

/**
 * Matches each distinct exercise name in the imported workouts to the library, most used first.
 * Tries, in order: the name as it is, without a version suffix, then with an equipment word in
 * front. The first step that finds anything decides the result.
 */
export function matchExerciseNames(workouts: ImportedWorkout[], library: Exercise[]): NameMatch[] {
  const findMatch = exerciseMatcher(library);
  return [...countSetsByName(workouts)]
    .map(([name, setCount]) => ({ name, setCount, match: findMatch(name) }))
    .sort((a, b) => b.setCount - a.setCount || a.name.localeCompare(b.name));
}

/** Builds the library lookup once, for matching many names. */
export function exerciseMatcher(library: Exercise[]): (name: string) => ExerciseMatch {
  const byName = groupByName(library);
  const lookUp = (name: string) => byName.get(name) ?? [];

  return (exportedName) => {
    const name = normalise(exportedName);
    const withoutVersion = name.replace(VERSION_SUFFIX, '');
    const candidates = [
      lookUp(name),
      lookUp(withoutVersion),
      EQUIPMENT_PREFIXES.flatMap((prefix) => lookUp(`${prefix} ${withoutVersion}`)),
    ].find((found) => found.length > 0);

    if (!candidates) return { kind: 'unmatched' };
    if (candidates.length === 1) return { kind: 'matched', exercise: candidates[0] };
    return { kind: 'choose', options: candidates };
  };
}

/**
 * Library exercises whose name has every word of the query, in any order, shortest names first
 * (the closest to what was typed). At most `limit` of them.
 */
export function searchExercises(library: Exercise[], query: string, limit: number): Exercise[] {
  const words = normalise(query).replace(VERSION_SUFFIX, '').split(' ').filter(Boolean);
  if (words.length === 0) return [];
  return library
    .filter((exercise) => {
      const name = normalise(exercise.name);
      return words.every((word) => name.includes(word));
    })
    .sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function countSetsByName(workouts: ImportedWorkout[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const exercise of workouts.flatMap((workout) => workout.exercises)) {
    counts.set(exercise.name, (counts.get(exercise.name) ?? 0) + exercise.sets.length);
  }
  return counts;
}

// A list per name: the library has a few names twice for different machines, e.g. "lever chest press"
function groupByName(library: Exercise[]): Map<string, Exercise[]> {
  const byName = new Map<string, Exercise[]>();
  for (const exercise of library) {
    const name = normalise(exercise.name);
    byName.set(name, [...(byName.get(name) ?? []), exercise]);
  }
  return byName;
}

function normalise(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
