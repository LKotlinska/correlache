import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { addDays, dayKey } from '../../../../utils/date';
import { Period } from '../../period';

const DEFAULT_PERIOD: Period = { unit: 'week', count: 8 };
/** Fewest workout days and rest days needed before the rates are compared. */
const MIN_DAYS = 5;
/** Difference in percentage points below which the rates count as about the same. */
const SAME_THRESHOLD = 10;

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-workout-day-headaches',
  styleUrl: './workout-day-headaches.scss',
  templateUrl: './workout-day-headaches.html',
})
export class WorkoutDayHeadaches {
  readonly minDays = MIN_DAYS;

  private data = inject(InsightsData);

  /** Workouts and headaches shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;

  /** The picked range, or the last 8 weeks. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD);
  periodLabel = this.shown.label;

  /** Workouts and headaches from the first shown day until now. */
  private workoutList = this.data.since('workouts', this.shown.start);
  private headacheList = this.data.since('headaches', this.shown.start);

  /**
   * Every day from the first shown day until two days ago, oldest first.
   * Yesterday and today are left out, as the day after them is not over yet.
   */
  private days = computed(() => {
    const today = new Date();
    const first = this.shown.start();
    const last = addDays(today, -2);
    const days: Date[] = [];
    for (let d = first; d <= last; d = addDays(d, 1)) days.push(d);
    return days;
  });

  /**
   * Workout days and rest days, each with how many were followed by a headache.
   * A day is followed by one when a headache started that day or the next. On workout days,
   * only headaches starting after the day's first workout count. On rest days, the window ends
   * at the next day's first workout, so its headaches are not counted for both groups.
   */
  groups = computed(() => {
    // Earliest workout start of each day.
    const firstWorkout = new Map<string, Date>();
    for (const w of this.workoutList()) {
      const start = new Date(w.startedAt);
      const key = dayKey(start);
      const earliest = firstWorkout.get(key);
      if (!earliest || start < earliest) firstWorkout.set(key, start);
    }

    const headacheStarts = this.headacheList().map(h => new Date(h.startedAt));

    const workoutDays = { days: 0, withHeadache: 0 };
    const restDays = { days: 0, withHeadache: 0 };
    for (const day of this.days()) {
      const workoutStart = firstWorkout.get(dayKey(day));
      const from = workoutStart ?? day;
      const until = workoutStart ? addDays(day, 2) : (firstWorkout.get(dayKey(addDays(day, 1))) ?? addDays(day, 2));
      const group = workoutStart ? workoutDays : restDays;

      group.days++;
      if (headacheStarts.some(h => h >= from && h < until)) group.withHeadache++;
    }
    return { workoutDays, restDays };
  });

  /** Whether both groups have enough days to be worth comparing. */
  enoughData = computed(() => {
    const { workoutDays, restDays } = this.groups();
    return workoutDays.days >= MIN_DAYS && restDays.days >= MIN_DAYS;
  });

  /** Headache rate of each group as a whole percentage, and how workout days compare. */
  summary = computed(() => {
    const { workoutDays, restDays } = this.groups();
    const workout = this.percent(workoutDays);
    const rest = this.percent(restDays);
    const diff = workout - rest;
    const trend: 'higher' | 'lower' | 'same' = Math.abs(diff) < SAME_THRESHOLD ? 'same' : diff > 0 ? 'higher' : 'lower';
    return { workout, rest, trend };
  });

  /** Chart.js data - one bar per group, showing the % of its days followed by a headache. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const { workoutDays, restDays } = this.groups();
    return {
      labels: ['Workout days', 'Rest days'],
      datasets: [{
        data: [this.percent(workoutDays), this.percent(restDays)],
        backgroundColor: [CHART_COLOR, `${CHART_COLOR}66`],
        borderRadius: 4,
      }],
    };
  });

  /** Percentages fixed at 0-100 so the two bars aren't exaggerated. The tooltip shows the day counts. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    scales: {
      x: { grid: { display: false } },
      y: { min: 0, max: 100, ticks: { callback: value => `${value}%` }, grid: { display: false } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: item => {
            const { workoutDays, restDays } = this.groups();
            const group = item.dataIndex === 0 ? workoutDays : restDays;
            return `${group.withHeadache} of ${group.days} days (${item.parsed.y}%)`;
          },
        },
      },
    },
  };

  private percent(group: { days: number; withHeadache: number }) {
    return group.days ? Math.round((group.withHeadache / group.days) * 100) : 0;
  }
}
