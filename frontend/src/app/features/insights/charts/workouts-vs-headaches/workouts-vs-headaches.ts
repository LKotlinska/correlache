import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { addDays, startOfWeek } from '../../../../utils/date';

const WEEKS_SHOWN = 8;

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

  /** Monday 00:00 of each shown week, oldest to newest. */
  private weekStarts = computed(() => {
    const thisMonday = startOfWeek(new Date());
    return Array.from({ length: WEEKS_SHOWN }, (_, i) => addDays(thisMonday, -7 * (WEEKS_SHOWN - 1 - i)));
  });

  /** Oldest to newest, including weeks without any workouts or headaches. */
  weeklyCounts = computed(() => {
    const weeks = this.weekStarts().map(date => ({ date, workouts: 0, headaches: 0 }));

    // Each entry belongs to the latest week that started on or before it; older entries are skipped.
    const newestFirst = [...weeks].reverse();
    const weekOf = (startedAt: string) => {
      const d = new Date(startedAt);
      return newestFirst.find(wk => wk.date <= d);
    };

    for (const w of this.workouts.value() ?? []) {
      const week = weekOf(w.startedAt);
      if (week) week.workouts++;
    }
    for (const h of this.headaches.value() ?? []) {
      const week = weekOf(h.startedAt);
      if (week) week.headaches++;
    }
    return weeks;
  });

  hasEntries = computed(() => this.weeklyCounts().some(w => w.workouts || w.headaches));

  /**
   * Average headaches in weeks with more workouts than the average week, compared with the other weeks.
   * Null when every week falls on the same side, as there is nothing to compare.
   */
  summary = computed(() => {
    const weeks = this.weeklyCounts();
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
