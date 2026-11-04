import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HeadacheService } from '../../services/headache.service';
import { WorkoutService } from '../../services/workout.service';
import { Workout } from '../../models/workout.model';
import { monthStart, startOfWeek, weekStarts } from '../../utils/date';

/** Headache months shown by the headache charts. */
const HEADACHE_MONTHS = 3;
/** Workout months shown by the exercise progress chart, the longest workout period. */
const WORKOUT_MONTHS = 6;
/** Weeks of workouts linked to headaches, shown by the charts comparing workouts with the headaches after them. */
const LINKED_WEEKS = 8;
const HOUR_MS = 60 * 60 * 1000;
/** Headaches starting from a workout's start until this many hours after it ends are linked to it. */
const WINDOW_HOURS = 24;

/**
 * Data shared by the insights charts, loaded once per visit to Insights.
 * Each resource covers the longest period any chart needs, and charts filter it to their own period.
 */
@Injectable()
export class InsightsData {
  private headacheService = inject(HeadacheService);
  private workoutService = inject(WorkoutService);

  /** Headaches from the Monday of the week holding the first shown month's first day, as pain over time starts on that Monday. */
  headaches = rxResource({
    stream: () => this.headacheService.getHeadaches({ from: startOfWeek(monthStart(HEADACHE_MONTHS - 1)) }),
  });

  /** Workouts from the first day of the oldest shown month, newest first. */
  workouts = rxResource({
    stream: () => this.workoutService.getWorkouts({ from: monthStart(WORKOUT_MONTHS - 1) }),
  });

  /** The exercise library, for each exercise's muscles. */
  exercises = rxResource({
    stream: () => this.workoutService.getExercises(),
  });

  /**
   * Workouts from the Monday of the oldest of the last LINKED_WEEKS weeks whose window is over, each with
   * the pain levels of its linked headaches. `hasPending` is true when a workout is left out because its
   * window is not over yet.
   */
  linkedWorkouts = computed(() => {
    const from = weekStarts(LINKED_WEEKS)[0].getTime();
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
}
