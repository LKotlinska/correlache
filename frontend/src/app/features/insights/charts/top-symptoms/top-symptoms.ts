import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { Period, periodLabel, periodStart } from '../../period';

const DEFAULT_PERIOD: Period = { unit: 'month', count: 3 };
const SYMPTOMS_SHOWN = 6;
/** Pixel height per bar, so the chart grows with the number of symptoms instead of stretching a few bars. */
const BAR_HEIGHT = 36;

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-top-symptoms',
  styleUrl: './top-symptoms.scss',
  templateUrl: './top-symptoms.html',
})
export class TopSymptoms {
  private data = inject(InsightsData);

  /** Headaches shared by the insights charts. */
  headaches = this.data.headaches;

  /** The picked range, or the last 3 months. */
  period = this.data.periodOr(DEFAULT_PERIOD);
  periodLabel = computed(() => periodLabel(this.period()));

  /** Headaches from the first shown day until now. */
  list = computed(() => {
    const from = periodStart(this.period());
    return (this.headaches.value() ?? []).filter(h => new Date(h.startedAt) >= from);
  });

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

  chartHeight = computed(() => this.symptomCounts().length * BAR_HEIGHT);

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
