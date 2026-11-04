import { Component, computed, inject } from '@angular/core';
import { WorkoutService } from '../../../../services/workout.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseBarOptions, CHART_COLOR } from '../../chart-defaults';

const WEEKS_SHOWN = 8;

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-workouts-per-week',
  styleUrl: './workouts-per-week.scss',
  templateUrl: './workouts-per-week.html',
})
export class WorkoutsPerWeek {
  private workoutService = inject(WorkoutService);

  /** Day and short month of a week's Monday, e.g. "4 Nov". */
  private weekStartFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

  /** Workouts from the Monday of the oldest shown week until now. */
  workouts = rxResource({
    stream: () => this.workoutService.getWorkouts({ from: this.weekStarts()[0] }),
  })

  /** Monday 00:00 of each shown week, oldest to newest. */
  private weekStarts = computed(() => {
    const now = new Date();
    // getDay() counts from Sunday, so shift it to count from Monday.
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 6) % 7);
    return Array.from({ length: WEEKS_SHOWN }, (_, i) =>
      new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() - 7 * (WEEKS_SHOWN - 1 - i)));
  });

  /** Oldest to newest, including weeks without any workouts. */
  weeklyCounts = computed(() => {
    const list = this.workouts.value() ?? [];
    const weeks = this.weekStarts().map(date => ({ date, count: 0 }));

    // Count each workout in the latest week that started on or before it.
    const newestFirst = [...weeks].reverse();
    for (const w of list) {
      const d = new Date(w.startedAt);
      const week = newestFirst.find(wk => wk.date <= d);
      if (week) week.count++;
    }
    return weeks;
  });

  /** This week's count and the average per week over all shown weeks. */
  summary = computed(() => {
    const weeks = this.weeklyCounts();
    const total = weeks.reduce((sum, w) => sum + w.count, 0);
    return {
      thisWeek: weeks[WEEKS_SHOWN - 1].count,
      average: Math.round((total / WEEKS_SHOWN) * 10) / 10,
    };
  });

  /** Chart.js data - one bar per week, labelled with the date its Monday falls on. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const weeks = this.weeklyCounts();
    return {
      labels: weeks.map(w => this.weekStartFmt.format(w.date)),
      datasets: [{
        data: weeks.map(w => w.count),
        backgroundColor: CHART_COLOR,
        borderRadius: 4,
      }],
    };
  });

  /** Vertical bars (weeks on x) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseBarOptions,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
    },
  };
}
