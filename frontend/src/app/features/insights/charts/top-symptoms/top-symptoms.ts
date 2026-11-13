import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { baseChartOptions, CHART_COLOR_SECONDARY, barChartHeight } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { ErrorMessage } from '../../../../components/error-message/error-message';

const SYMPTOMS_SHOWN = 6;

@Component({
  imports: [ErrorMessage, BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
  selector: 'app-top-symptoms',
  styleUrl: './top-symptoms.scss',
  templateUrl: './top-symptoms.html',
})
export class TopSymptoms {
  private data = inject(InsightsData);

  /** Headaches shared by the insights charts. */
  headaches = this.data.headaches;

  /** The picked range. */
  private shown = this.data.chartPeriod();
  periodLabel = this.shown.label;

  /** Headaches from the first shown day until now. */
  list = this.data.since('headaches', this.shown.start);

  /** Most common symptoms first, at most SYMPTOMS_SHOWN. Ties keep alphabetical order. */
  symptomCounts = computed(() => {
    const counts = new Map<string, number>();

    for (const h of this.list()) {
      for (const s of h.symptoms ?? []) {
        counts.set(s.name, (counts.get(s.name) ?? 0) + 1);
      }
    }

    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, SYMPTOMS_SHOWN);
  });

  /** Number of headaches the top symptom was logged for, out of all headaches in the period. */
  summary = computed(() => {
    const top = this.symptomCounts()[0];
    if (!top) return null;
    return { name: top.name, count: top.count, total: this.list().length };
  });

  chartHeight = computed(() => barChartHeight(this.symptomCounts().length));

  /** Chart.js data - one bar per symptom, most common at the top. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const symptoms = this.symptomCounts();
    return {
      labels: symptoms.map(s => s.name),
      datasets: [{
        data: symptoms.map(s => s.count),
        backgroundColor: CHART_COLOR_SECONDARY,
        borderRadius: 4,
      }],
    };
  });

  /** Horizontal bars (symptoms on y) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    indexAxis: 'y',
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
      y: { grid: { display: false } },
    },
  };
}
