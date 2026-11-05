import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HeadacheService } from '../../services/headache.service';
import { WorkoutService } from '../../services/workout.service';
import { Workout } from '../../models/workout.model';
import { startOfWeek } from '../../utils/date';
import { Period, periodStart } from './period';

/** Longest default period of the headache charts. */
const HEADACHE_PERIOD: Period = { unit: 'month', count: 3 };
/** Longest default period of the workout charts, shown by exercise progress. */
const WORKOUT_PERIOD: Period = { unit: 'month', count: 6 };
/** Default period of workouts linked to headaches, shown by the charts comparing workouts with the headaches after them. */
const LINKED_PERIOD: Period = { unit: 'week', count: 8 };
const HOUR_MS = 60 * 60 * 1000;
/** Headaches starting from a workout's start until this many hours after it ends are linked to it. */
const WINDOW_HOURS = 24;

/**
 * Data shared by the insights charts, loaded once per visit to Insights and again when a longer range is picked.
 * Each resource covers the longest period any chart needs, and charts filter it to their own period.
 */
@Injectable()
export class InsightsData {
  private headacheService = inject(HeadacheService);
  private workoutService = inject(WorkoutService);

  /** Period picked for every chart, or null for each chart's own default period. */
  range = signal<Period | null>(null);

  /** Headaches from the Monday of the week holding the first shown day, as charts by week start on that Monday. */
  headaches = rxResource({
    params: () => this.loadFrom(HEADACHE_PERIOD),
    stream: ({ params: from }) => this.headacheService.getHeadaches({ from: new Date(from) }),
  });

  /** Workouts from the Monday of the week holding the first shown day, newest first. */
  workouts = rxResource({
    params: () => this.loadFrom(WORKOUT_PERIOD),
    stream: ({ params: from }) => this.workoutService.getWorkouts({ from: new Date(from) }),
  });

  /** The exercise library, for each exercise's muscles. */
  exercises = rxResource({
    stream: () => this.workoutService.getExercises(),
  });

  /** Period of the linked workouts. */
  linkedPeriod = this.periodOr(LINKED_PERIOD);

  /**
   * Workouts from the first day of the linked period whose window is over, each with the pain levels of
   * its linked headaches. `hasPending` is true when a workout is left out because its window is not over yet.
   */
  linkedWorkouts = computed(() => {
    const from = periodStart(this.linkedPeriod()).getTime();
    const now = Date.now();
    const headaches = (this.headaches.value() ?? []).map(h => ({ start: new Date(h.startedAt).getTime(), pain: h.painLevel }));

    const linked: { workout: Workout; pains: number[] }[] = [];
    let hasPending = false;
    for (const workout of this.workouts.value() ?? []) {
      const start = new Date(workout.startedAt).getTime();
      const until = start + workout.durationSeconds * 1000 + WINDOW_HOURS * HOUR_MS;
      if (start < from) continue;
      if (until > now) {
        hasPending = true;
        continue;
      }
      linked.push({ workout, pains: headaches.filter(h => h.start >= start && h.start < until).map(h => h.pain) });
    }
    return { linked, hasPending };
  });

  /** The picked period, or `fallback` while none is picked. */
  periodOr(fallback: Period) {
    return computed(() => this.range() ?? fallback);
  }

  /**
   * Time of the Monday of the week holding the first day of `longest` or of the picked range, whichever is earlier.
   * A number, so picking a range inside what is already loaded does not load it again.
   */
  private loadFrom(longest: Period): number {
    const range = this.range();
    const start = Math.min(periodStart(longest).getTime(), range ? periodStart(range).getTime() : Infinity);
    return startOfWeek(new Date(start)).getTime();
  }
}
