import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { weekIndex, weekStarts } from '../../../../utils/date';

const WEEKS_SHOWN = 8;

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-workouts-per-week',
  styleUrl: './workouts-per-week.scss',
  templateUrl: './workouts-per-week.html',
})
export class WorkoutsPerWeek {
  /** Day and short month of a week's Monday, e.g. "4 Nov". */
  private weekStartFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

  /** Workouts shared by the insights charts. */
  workouts = inject(InsightsData).workouts;

  /** Workouts from the Monday of the oldest shown week until now. */
  list = computed(() => (this.workouts.value() ?? []).filter(w => new Date(w.startedAt) >= this.weekStarts()[0]));

  /** Monday 00:00 of each shown week, oldest to newest. */
  private weekStarts = computed(() => weekStarts(WEEKS_SHOWN));

  /** Oldest to newest, including weeks without any workouts. */
  weeklyCounts = computed(() => {
    const mondays = this.weekStarts();
    const weeks = mondays.map(date => ({ date, count: 0 }));
    for (const w of this.list()) {
      const i = weekIndex(mondays, new Date(w.startedAt));
      if (i >= 0) weeks[i].count++;
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
    ...baseChartOptions,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
    },
  };
}
