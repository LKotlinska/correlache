import { inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HeadacheService } from '../../services/headache.service';
import { WorkoutService } from '../../services/workout.service';
import { monthStart, startOfWeek } from '../../utils/date';

/** Headache months shown by the headache charts. */
const HEADACHE_MONTHS = 3;
/** Workout months shown by the exercise progress chart, the longest workout period. */
const WORKOUT_MONTHS = 6;

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
}
