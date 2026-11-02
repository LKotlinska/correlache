import { TrackingMode } from '../models/workout.model';

export interface TrackedFields {
  weight: boolean;
  reps: boolean;
  distance: boolean;
  duration: boolean;
}

/** Which set fields each mode measures. Mirrors TRACKED_FIELDS in the backend. */
export const TRACKED_FIELDS: Record<TrackingMode, TrackedFields> = {
  weight_reps: { weight: true, reps: true, distance: false, duration: false },
  reps: { weight: false, reps: true, distance: false, duration: false },
  duration: { weight: false, reps: false, distance: false, duration: true },
  duration_distance: { weight: false, reps: false, distance: true, duration: true },
};

export const TRACKING_MODE_OPTIONS: { value: TrackingMode; label: string }[] = [
  { value: 'weight_reps', label: 'Weight & reps' },
  { value: 'reps', label: 'Reps only' },
  { value: 'duration', label: 'Time' },
  { value: 'duration_distance', label: 'Time & distance' },
];

// Equipment that is not loaded with a weight, or is measured over time. Compared in lower case.
const REPS_ONLY_EQUIPMENT = new Set(['body weight', 'assisted', 'rope', 'band', 'resistance band', 'roller', 'wheel roller']);
const TIME_DISTANCE_EQUIPMENT = new Set(['stationary bike', 'elliptical machine', 'stepmill machine', 'skierg machine', 'upper body ergometer']);

/** The mode an exercise starts with; the user can change it per exercise. */
export function defaultTrackingModeFor(equipmentName: string): TrackingMode {
  const name = equipmentName.toLowerCase();
  if (REPS_ONLY_EQUIPMENT.has(name)) return 'reps';
  if (TIME_DISTANCE_EQUIPMENT.has(name)) return 'duration_distance';
  return 'weight_reps';
}

export function columnCount(tracked: TrackedFields): number {
  return (tracked.weight ? 1 : 0) + (tracked.reps ? 1 : 0) + (tracked.distance ? 1 : 0) + (tracked.duration ? 2 : 0);
}
