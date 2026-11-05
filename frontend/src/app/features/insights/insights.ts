import { Component, signal } from '@angular/core';
import { MatChipListbox, MatChipListboxChange, MatChipOption } from '@angular/material/chips';
import { HeadachesPerMonth } from './charts/headaches-per-month/headaches-per-month';
import { TopTriggers } from './charts/top-triggers/top-triggers';
import { TopSymptoms } from './charts/top-symptoms/top-symptoms';
import { PainOverTime } from './charts/pain-over-time/pain-over-time';
import { HeadachesByWeekday } from './charts/headaches-by-weekday/headaches-by-weekday';
import { WorkoutsPerWeek } from './charts/workouts-per-week/workouts-per-week';
import { ExerciseProgress } from './charts/exercise-progress/exercise-progress';
import { MuscleBalance } from './charts/muscle-balance/muscle-balance';
import { WorkoutsVsHeadaches } from './charts/workouts-vs-headaches/workouts-vs-headaches';
import { WorkoutDayHeadaches } from './charts/workout-day-headaches/workout-day-headaches';
import { TimeSinceWorkout } from './charts/time-since-workout/time-since-workout';
import { MuscleGroupHeadaches } from './charts/muscle-group-headaches/muscle-group-headaches';
import { InsightsData } from './insights-data';

export type InsightsCategory = 'headaches' | 'workouts' | 'correlations';
export type InsightsFilter = 'all' | InsightsCategory;

@Component({
  imports: [
    MatChipListbox,
    MatChipOption,
    HeadachesPerMonth,
    TopTriggers,
    TopSymptoms,
    PainOverTime,
    HeadachesByWeekday,
    WorkoutsPerWeek,
    WorkoutsVsHeadaches,
    WorkoutDayHeadaches,
    TimeSinceWorkout,
    MuscleGroupHeadaches,
    ExerciseProgress,
    MuscleBalance,
  ],
  providers: [InsightsData],
  selector: 'app-insights',
  styleUrl: './insights.scss',
  templateUrl: './insights.html',
})
export class Insights {
  filter = signal<InsightsFilter>('all');

  shows(category: InsightsCategory): boolean {
    return this.filter() === 'all' || this.filter() === category;
  }

  onFilterChange(event: MatChipListboxChange) {
    // Clicking the selected chip would clear the selection; keep the current filter instead
    if (event.value) this.filter.set(event.value);
    else event.source.value = this.filter();
  }
}
