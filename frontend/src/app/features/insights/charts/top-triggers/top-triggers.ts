import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY, barChartHeight } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { ErrorMessage } from '../../../../components/error-message/error-message';

const TRIGGERS_SHOWN = 6;

@Component({
  imports: [ErrorMessage, BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
  selector: 'app-top-triggers',
  styleUrl: './top-triggers.scss',
  templateUrl: './top-triggers.html',
})
export class TopTriggers {
  private data = inject(InsightsData);

  /** Headaches shared by the insights charts. */
  headaches = this.data.headaches;

  /** The picked range. */
  private shown = this.data.chartPeriod();
  periodLabel = this.shown.label;

  /** Headaches from the first shown day until now. */
  list = this.data.since('headaches', this.shown.start);

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

  chartHeight = computed(() => barChartHeight(this.triggerCounts().length));

  /** Chart.js data - one bar per trigger, most common at the top. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const triggers = this.triggerCounts();
    return {
      labels: triggers.map(t => t.name),
      datasets: [{
        data: triggers.map(t => t.count),
        backgroundColor: CHART_COLOR_SECONDARY,
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
