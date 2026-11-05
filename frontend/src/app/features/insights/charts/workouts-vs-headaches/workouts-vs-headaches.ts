import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { weekIndex } from '../../../../utils/date';
import { Period, periodLabel, periodWeeks } from '../../period';

const DEFAULT_PERIOD: Period = { unit: 'week', count: 8 };

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-workouts-vs-headaches',
  styleUrl: './workouts-vs-headaches.scss',
  templateUrl: './workouts-vs-headaches.html',
})
export class WorkoutsVsHeadaches {
  /** Day and short month of a week's Monday, e.g. "4 Nov". */
  private weekStartFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

  private data = inject(InsightsData);

  /** Workouts and headaches shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;

  /** The picked range, or the last 8 weeks. */
  period = this.data.periodOr(DEFAULT_PERIOD);
  periodLabel = computed(() => periodLabel(this.period()));

  /** Monday 00:00 of each shown week, oldest to newest. */
  private weekStarts = computed(() => periodWeeks(this.period()));

  /** Oldest to newest, including weeks without any workouts or headaches. Entries before the oldest week are skipped. */
  weeklyCounts = computed(() => {
    const mondays = this.weekStarts();
    const weeks = mondays.map(date => ({ date, workouts: 0, headaches: 0 }));

    for (const w of this.workouts.value() ?? []) {
      const i = weekIndex(mondays, new Date(w.startedAt));
      if (i >= 0) weeks[i].workouts++;
    }
    for (const h of this.headaches.value() ?? []) {
      const i = weekIndex(mondays, new Date(h.startedAt));
      if (i >= 0) weeks[i].headaches++;
    }
    return weeks;
  });

  hasEntries = computed(() => this.weeklyCounts().some(w => w.workouts || w.headaches));

  /**
   * Average headaches in weeks with more workouts than the average week, compared with the other weeks.
   * The current week is left out, as it is not over yet. Null when every week falls on the same side,
   * as there is nothing to compare.
   */
  summary = computed(() => {
    const weeks = this.weeklyCounts().slice(0, -1);
    const avgWorkouts = weeks.reduce((sum, w) => sum + w.workouts, 0) / weeks.length;
    const active = weeks.filter(w => w.workouts > avgWorkouts);
    const quiet = weeks.filter(w => w.workouts <= avgWorkouts);
    if (!active.length || !quiet.length) return null;

    const avgHeadaches = (ws: typeof weeks) => (ws.reduce((sum, w) => sum + w.headaches, 0) / ws.length).toFixed(1);
    return { active: avgHeadaches(active), quiet: avgHeadaches(quiet) };
  });

  /** Chart.js data - workouts as bars and headaches as a line, one point per week. */
  chartData = computed<ChartData<'bar' | 'line'>>(() => {
    const weeks = this.weeklyCounts();
    return {
      labels: weeks.map(w => this.weekStartFmt.format(w.date)),
      datasets: [
        {
          type: 'bar',
          label: 'Workouts',
          data: weeks.map(w => w.workouts),
          backgroundColor: CHART_COLOR,
          borderRadius: 4,
          order: 2,
        },
        {
          type: 'line',
          label: 'Headaches',
          data: weeks.map(w => w.headaches),
          borderColor: CHART_COLOR_SECONDARY,
          backgroundColor: CHART_COLOR_SECONDARY,
          pointRadius: 4,
          tension: 0.3,
          // Drawn on top of the bars.
          order: 1,
        },
      ],
    };
  });

  /** Both series are counts per week, so they share one y axis. The legend tells them apart. */
  chartOptions: ChartOptions<'bar' | 'line'> = {
    ...baseChartOptions,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: true, position: 'bottom', labels: { usePointStyle: true } },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: { title: items => `Week of ${items[0].label}` },
      },
    },
  };
}
