import { Component, inject, signal } from '@angular/core';
import { MatChipListbox, MatChipListboxChange, MatChipOption } from '@angular/material/chips';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
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
import { DataNotice } from './data-notice/data-notice';
import { InsightsData } from './insights-data';
import { Period } from './period';

export type InsightsCategory = 'headaches' | 'workouts' | 'correlations';
export type InsightsFilter = 'all' | InsightsCategory;

/** Time ranges that can be picked. 'default' leaves each chart on its own period. */
const RANGES: { key: string; label: string; period: Period | null }[] = [
  { key: 'default', label: 'Default', period: null },
  { key: '4w', label: 'Last 4 weeks', period: { unit: 'week', count: 4 } },
  { key: '8w', label: 'Last 8 weeks', period: { unit: 'week', count: 8 } },
  { key: '3m', label: 'Last 3 months', period: { unit: 'month', count: 3 } },
  { key: '6m', label: 'Last 6 months', period: { unit: 'month', count: 6 } },
  { key: '12m', label: 'Last 12 months', period: { unit: 'month', count: 12 } },
];

const DISMISSED_KEY = 'insights-data-notice-dismissed';

function loadDismissed(): InsightsCategory[] {
  try {
    const stored = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

@Component({
  imports: [
    MatChipListbox,
    MatChipOption,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    DataNotice,
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
  private data = inject(InsightsData);

  readonly ranges = RANGES;

  filter = signal<InsightsFilter>('all');

  rangeKey = signal('default');

  readiness = this.data.readiness;

  /** Categories whose "needs more data" notice the user has dismissed. */
  private dismissed = signal<InsightsCategory[]>(loadDismissed());

  /** True while a category has too little data and the user has not chosen to look anyway. */
  gated(category: InsightsCategory): boolean {
    const r = this.readiness()?.[category];
    return !!r && !r.ready && !this.dismissed().includes(category);
  }

  dismiss(category: InsightsCategory) {
    this.dismissed.update(d => [...d, category]);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(this.dismissed()));
    } catch {
      // Storage unavailable: the notice comes back next visit
    }
  }

  shows(category: InsightsCategory): boolean {
    return this.filter() === 'all' || this.filter() === category;
  }

  onFilterChange(event: MatChipListboxChange) {
    // Clicking the selected chip would clear the selection; keep the current filter instead
    if (event.value) this.filter.set(event.value);
    else event.source.value = this.filter();
  }

  onRangeChange(key: string) {
    this.rangeKey.set(key);
    this.data.range.set(RANGES.find(r => r.key === key)!.period);
  }
}
