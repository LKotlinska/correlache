import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { baseChartOptions, CHART_COLOR_SECONDARY, barChartHeight } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { Period } from '../../period';
import { ErrorMessage } from '../../../../components/error-message/error-message';

const DEFAULT_PERIOD: Period = { unit: 'month', count: 3 };
const LOCATIONS_SHOWN = 6;

@Component({
  imports: [ErrorMessage, BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
  selector: 'app-top-locations',
  styleUrl: './top-locations.scss',
  templateUrl: './top-locations.html',
})
export class TopLocations {
  private data = inject(InsightsData);

  /** Headaches shared by the insights charts. */
  headaches = this.data.headaches;

  /** The picked range, or the last 3 months. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD);
  periodLabel = this.shown.label;

  /** Headaches from the first shown day until now. */
  list = this.data.since('headaches', this.shown.start);

  /** Most common locations first, at most LOCATIONS_SHOWN. Ties keep alphabetical order. */
  locationCounts = computed(() => {
    const counts = new Map<string, number>();

    for (const h of this.list()) {
      for (const l of h.locations ?? []) {
        counts.set(l.name, (counts.get(l.name) ?? 0) + 1);
      }
    }

    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, LOCATIONS_SHOWN);
  });

  /** Number of headaches the top location was logged for, out of all headaches in the period. */
  summary = computed(() => {
    const top = this.locationCounts()[0];
    if (!top) return null;
    return { name: top.name, count: top.count, total: this.list().length };
  });

  chartHeight = computed(() => barChartHeight(this.locationCounts().length));

  /** Chart.js data - one bar per location, most common at the top. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const locations = this.locationCounts();
    return {
      labels: locations.map(l => l.name),
      datasets: [{
        data: locations.map(l => l.count),
        backgroundColor: CHART_COLOR_SECONDARY,
        borderRadius: 4,
      }],
    };
  });

  /** Horizontal bars (locations on y) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    indexAxis: 'y',
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
      y: { grid: { display: false } },
    },
  };
}
