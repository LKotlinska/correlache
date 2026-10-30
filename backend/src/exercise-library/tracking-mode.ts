// What the user measures for an exercise in a workout. It decides which set fields are stored.
export const TRACKING_MODES = ['weight_reps', 'reps', 'duration', 'duration_distance'] as const;
export type TrackingMode = (typeof TRACKING_MODES)[number];

export const DEFAULT_TRACKING_MODE: TrackingMode = 'weight_reps';

export interface TrackedFields {
  weight: boolean;
  reps: boolean;
  distance: boolean;
  durationSeconds: boolean;
}

export const TRACKED_FIELDS: Record<TrackingMode, TrackedFields> = {
  weight_reps: { weight: true, reps: true, distance: false, durationSeconds: false },
  reps: { weight: false, reps: true, distance: false, durationSeconds: false },
  duration: { weight: false, reps: false, distance: false, durationSeconds: true },
  duration_distance: { weight: false, reps: false, distance: true, durationSeconds: true },
};
