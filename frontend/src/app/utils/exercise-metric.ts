import { TrackingMode, WorkoutSet } from '../models/workout.model';

/**
 * One session's value for an exercise: the heaviest set, most reps, longest set, or average speed for time and
 * distance. Null when its sets hold nothing for the mode.
 */
export function sessionValue(mode: TrackingMode, sets: WorkoutSet[]): number | null {
  if (mode === 'duration_distance') {
    // Total distance over total time, like exerciseVolume() in the backend.
    const km = sets.reduce((sum, s) => sum + (s.distance ?? 0), 0);
    const seconds = sets.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
    return km > 0 && seconds > 0 ? km / (seconds / 3600) : null;
  }

  const field = mode === 'weight_reps' ? 'weight' : mode === 'reps' ? 'reps' : 'durationSeconds';
  const values = sets.map(s => s[field]).filter((v): v is number => v !== null && v > 0);
  return values.length ? Math.max(...values) : null;
}
