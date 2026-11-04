import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { monthStart } from '../../../../utils/date';

const MONTHS_SHOWN = 3;
const TRIGGERS_SHOWN = 6;
/** Pixel height per bar, so the chart grows with the number of triggers instead of stretching a few bars. */
const BAR_HEIGHT = 36;

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-top-triggers',
  styleUrl: './top-triggers.scss',
  templateUrl: './top-triggers.html',
})
export class TopTriggers {
  /** Headaches shared by the insights charts. */
  headaches = inject(InsightsData).headaches;

  /** Headaches from the first day of the oldest shown month until now. */
  list = computed(() => {
    const from = monthStart(MONTHS_SHOWN - 1);
    return (this.headaches.value() ?? []).filter(h => new Date(h.startedAt) >= from);
  });

  /** Most common triggers first, at most TRIGGERS_SHOWN. Ties keep alphabetical order. */
  triggerCounts = computed(() => {
    const counts = new Map<string, number>();

    for (const h of this.list()) {
      for (const t of h.triggers ?? []) {
        counts.set(t.name, (counts.get(t.name) ?? 0) + 1);
      }
    }

    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, TRIGGERS_SHOWN);
  });

  /** Number of headaches the top trigger was logged for, out of all headaches in the period. */
  summary = computed(() => {
    const top = this.triggerCounts()[0];
    if (!top) return null;
    return { name: top.name, count: top.count, total: this.list().length };
  });

  chartHeight = computed(() => this.triggerCounts().length * BAR_HEIGHT);

  /** Chart.js data - one bar per trigger, most common at the top. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const triggers = this.triggerCounts();
    return {
      labels: triggers.map(t => t.name),
      datasets: [{
        data: triggers.map(t => t.count),
        backgroundColor: CHART_COLOR,
        borderRadius: 4,
      }],
    };
  });

  /** Horizontal bars (triggers on y) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    indexAxis: 'y',
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
      y: { grid: { display: false } },
    },
  };
}
