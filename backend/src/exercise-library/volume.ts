import { WorkoutSet } from "./entities/set.entity.js"
import { TRACKED_FIELDS, TrackingMode } from "./tracking-mode.js"

export interface VolumeSet {
    weight: number | null;
    reps: number | null;
    distance: number | null;
    durationSeconds: number | null;
}

export type VolumeUnit = 'kg' | 'reps' | 'seconds' | 'km';

export interface ExerciseVolume {
    primary: { value: number; unit: VolumeUnit };
    totalReps: number;
    totalDistanceKm: number;
    totalSeconds: number;
    avgSpeedKmh: number | null;
}

const PRIMARY_UNIT: Record<TrackingMode, VolumeUnit> = {
    weight_reps: 'kg',
    reps: 'reps',
    duration: 'seconds',
    duration_distance: 'km'
}

// Empty or untracked fields count as 0, so a half-filled set never produces NaN.
function trackedValues(mode: TrackingMode, set: VolumeSet) {
    const tracked = TRACKED_FIELDS[mode];
    return {
        weight: tracked.weight ? (set.weight ?? 0) : 0,
        reps: tracked.reps ? (set.reps ?? 0) : 0,
        distance: tracked.distance ? (set.distance ?? 0) : 0,
        seconds: tracked.durationSeconds ? (set.durationSeconds ?? 0) : 0,    
    }
}

// The primary volume of one set, in the unit of the mode
export function setVolume(mode: TrackingMode, set: VolumeSet): number {
    const { weight, reps, distance, seconds } = trackedValues(mode, set);
    switch (mode) {
        case 'weight_reps': return weight * reps;
        case 'reps': return reps;
        case 'duration': return seconds;
        case 'duration_distance': return distance;
    }
}

export function exerciseVolume(mode: TrackingMode, sets: VolumeSet[]): ExerciseVolume {
    let primary = 0;
    let totalReps = 0;
    let totalDistanceKm = 0;
    let totalSeconds = 0;
    let avgSpeedKmh: number | null = null;

    for ( const set of sets) {
        const values = trackedValues(mode, set);
        primary += setVolume(mode, set);
        totalReps += values.reps;
        totalDistanceKm += values.distance;
        totalSeconds += values.seconds;
    }

    // Total distance over total time
    if (mode === 'duration_distance' && totalSeconds > 0 && totalDistanceKm > 0) {
        avgSpeedKmh = totalDistanceKm / (totalSeconds / 3600);
    }

    return {
        primary: { value: primary, unit: PRIMARY_UNIT[mode] },
        totalReps,
        totalDistanceKm,
        totalSeconds,
        avgSpeedKmh,
    };
}
