import { Workout } from '../../models/workout.model';
import { sessionValue } from '../../utils/exercise-metric';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days of recent training compared with the longer average. */
export const ACUTE_DAYS = 7;
/** Days the usual weekly training is averaged over. */
export const CHRONIC_DAYS = 28;
/** Recent training at least this many times the usual week is a spike (the acute:chronic workload ratio). */
export const SPIKE_RATIO = 1.3;
/** Days before a session its exercises are compared with for a personal best. */
export const BEST_LOOKBACK_DAYS = 90;
/** Earlier sessions of an exercise needed before beating them counts as a personal best. */
const MIN_EARLIER_SESSIONS = 2;

/**
 * Minutes trained in the ACUTE_DAYS up to and including `at`, divided by the average week over the CHRONIC_DAYS up
 * to it. Null when `workouts` (any order) don't reach back CHRONIC_DAYS, so the usual week isn't known yet.
 * Duration is the load because every workout has it, cardio included.
 */
export function loadRatio(at: number, workouts: Workout[]): number | null {
  const times = workouts.map(w => ({ start: Date.parse(w.startedAt), minutes: w.durationSeconds / 60 }));
  if (!times.some(t => t.start <= at - CHRONIC_DAYS * DAY_MS)) return null;

  const minutesSince = (days: number) =>
    times.filter(t => t.start > at - days * DAY_MS && t.start <= at).reduce((sum, t) => sum + t.minutes, 0);
  const usualWeek = (minutesSince(CHRONIC_DAYS) / CHRONIC_DAYS) * ACUTE_DAYS;
  return usualWeek > 0 ? minutesSince(ACUTE_DAYS) / usualWeek : null;
}

/**
 * Names of the exercises in `workout` that beat their best of the BEST_LOOKBACK_DAYS before it, in the same
 * tracking mode. An exercise needs MIN_EARLIER_SESSIONS earlier sessions, so a first try is never a best.
 * Weight and reps exercises logged without weight compare reps, like the exercise progress chart.
 */
export function personalBests(workout: Workout, workouts: Workout[]): string[] {
  const at = Date.parse(workout.startedAt);
  const earlier = workouts.filter(w => {
    const start = Date.parse(w.startedAt);
    return start < at && start >= at - BEST_LOOKBACK_DAYS * DAY_MS;
  });

  return workout.exercises.flatMap(e => {
    const previous = earlier.flatMap(w => w.exercises.filter(p => p.exerciseId === e.exerciseId && p.trackingMode === e.trackingMode));
    if (previous.length < MIN_EARLIER_SESSIONS) return [];

    const weighted = e.trackingMode === 'weight_reps' && [e, ...previous].some(p => p.sets.some(s => (s.weight ?? 0) > 0));
    const mode = e.trackingMode === 'weight_reps' && !weighted ? 'reps' : e.trackingMode;
    const value = sessionValue(mode, e.sets);
    const best = Math.max(...previous.map(p => sessionValue(mode, p.sets) ?? 0));
    return value !== null && best > 0 && value > best ? [e.exerciseName] : [];
  });
}
