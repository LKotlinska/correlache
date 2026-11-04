import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { monthStart } from '../../../../utils/date';

const MONTHS_SHOWN = 3;
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
  /** Headaches shared by the insights charts. */
  headaches = inject(InsightsData).headaches;

  /** Headaches from the first day of the oldest shown month until now. */
  list = computed(() => {
    const from = monthStart(MONTHS_SHOWN - 1);
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
        backgroundColor: CHART_COLOR,
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
