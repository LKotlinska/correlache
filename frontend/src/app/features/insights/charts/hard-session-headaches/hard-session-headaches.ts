import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { ChartInfo } from '../../chart-info/chart-info';
import { InsightsData } from '../../insights-data';
import { Period } from '../../period';
import { addDays } from '../../../../utils/date';
import { Count, MIN_WORKOUTS, probabilityHigher } from '../../suspects';
import { BEST_LOOKBACK_DAYS, loadRatio, personalBests, SPIKE_RATIO } from '../../training-load';

const DEFAULT_PERIOD: Period = { unit: 'month', count: 6 };
/** Chance from which headaches count as more common after these sessions, or below 1 minus it, less common. */
const CLEAR = 0.8;

/** How headaches after one kind of hard session compare with headaches after the rest. */
interface Comparison {
  /** e.g. "load spike", used in sentences. */
  name: string;
  label: string;
  hard: Count;
  other: Count;
  /** 'few' when either side has fewer than MIN_WORKOUTS workouts. */
  verdict: 'more' | 'less' | 'same' | 'few';
}

@Component({
  imports: [ChartInfo, BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
  selector: 'app-hard-session-headaches',
  styleUrl: './hard-session-headaches.scss',
  templateUrl: './hard-session-headaches.html',
})
export class HardSessionHeadaches {
  readonly minWorkouts = MIN_WORKOUTS;
  readonly spikePercent = Math.round((SPIKE_RATIO - 1) * 100);

  private data = inject(InsightsData);

  /** Workouts and headaches shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;

  /** The picked range, or the last 6 months. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD);
  periodLabel = this.shown.label;

  private linkedWorkouts = this.data.linkedWorkouts(this.shown.start);
  /** Workouts back to BEST_LOOKBACK_DAYS before the period, which also covers the 4 weeks a load ratio needs. */
  private history = this.data.since('workouts', computed(() => addDays(this.shown.start(), -BEST_LOOKBACK_DAYS)));

  /** Whether a workout is left out because its window is not over yet. */
  hasPending = computed(() => this.linkedWorkouts().hasPending);

  /** Each linked workout's load ratio (null while the usual week isn't known), its personal bests and its headache. */
  sessions = computed(() => {
    const history = this.history();
    return this.linkedWorkouts().linked.map(({ workout, pains }) => ({
      ratio: loadRatio(Date.parse(workout.startedAt), history),
      bests: personalBests(workout, history),
      headache: pains.length > 0,
    }));
  });

  comparisons = computed<Comparison[]>(() => {
    const sessions = this.sessions();
    const known = sessions.filter(s => s.ratio !== null);
    return [
      this.compare('load spike', 'Load spike', known.filter(s => s.ratio! >= SPIKE_RATIO), known.filter(s => s.ratio! < SPIKE_RATIO)),
      this.compare('personal best', 'Personal best', sessions.filter(s => s.bests.length), sessions.filter(s => !s.bests.length)),
    ];
  });

  hasComparison = computed(() => this.comparisons().some(c => c.hard.workouts + c.other.workouts > 0));

  /** Exercises beaten most often in the shown sessions, for the note. */
  topBests = computed(() => {
    const counts = new Map<string, number>();
    for (const name of this.sessions().flatMap(s => s.bests)) counts.set(name, (counts.get(name) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  });

  /** Chart.js data - for each kind of hard session, the headache rate after it and after the other sessions. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const comparisons = this.comparisons();
    return {
      labels: comparisons.map(c => c.label),
      datasets: [
        { label: 'Yes', data: comparisons.map(c => this.percent(c.hard)), backgroundColor: CHART_COLOR, borderRadius: 4 },
        { label: 'No', data: comparisons.map(c => this.percent(c.other)), backgroundColor: CHART_COLOR_SECONDARY, borderRadius: 4 },
      ],
    };
  });

  /** Vertical grouped bars with percentages fixed at 0-100 and a legend for the two groups. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    scales: {
      y: { min: 0, max: 100, ticks: { callback: value => `${value}%` } },
      x: { grid: { display: false } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: true, position: 'bottom' },
      tooltip: {
        callbacks: {
          label: item => {
            const c = this.comparisons()[item.dataIndex];
            const count = item.datasetIndex === 0 ? c.hard : c.other;
            return `${item.dataset.label}: ${count.withHeadache} of ${count.workouts} workouts (${this.percent(count)}%)`;
          },
        },
      },
    },
  };

  percent({ workouts, withHeadache }: Count): number {
    return workouts ? Math.round((withHeadache / workouts) * 100) : 0;
  }

  private compare(name: string, label: string, hard: { headache: boolean }[], other: { headache: boolean }[]): Comparison {
    const count = (sessions: { headache: boolean }[]): Count => ({
      workouts: sessions.length,
      withHeadache: sessions.filter(s => s.headache).length,
    });
    const c = { name, label, hard: count(hard), other: count(other) };
    if (c.hard.workouts < MIN_WORKOUTS || c.other.workouts < MIN_WORKOUTS) return { ...c, verdict: 'few' };
    const p = probabilityHigher(c.hard, c.other);
    return { ...c, verdict: p >= CLEAR ? 'more' : p <= 1 - CLEAR ? 'less' : 'same' };
  }
}
