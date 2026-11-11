import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { Period } from '../../period';
import { ErrorMessage } from '../../../../components/error-message/error-message';

const DEFAULT_PERIOD: Period = { unit: 'week', count: 8 };
/** Durations are rounded to this many minutes, so similar workouts share one bubble. */
const ROUND_MINUTES = 5;
/** Fewest workouts needed before the summary compares longer and shorter ones. */
const MIN_WORKOUTS = 6;

@Component({
  imports: [ErrorMessage, BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
  selector: 'app-intensity-vs-pain',
  styleUrl: './intensity-vs-pain.scss',
  templateUrl: './intensity-vs-pain.html',
})
export class IntensityVsPain {
  private data = inject(InsightsData);

  /** Workouts and headaches shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;

  /** The picked range, or the last 8 weeks. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD);
  periodLabel = this.shown.label;

  private linkedWorkouts = this.data.linkedWorkouts(this.shown.start);

  /** Each linked workout's duration in minutes and the highest pain of its linked headaches (0 for none). */
  points = computed(() =>
    this.linkedWorkouts().linked.map(({ workout, pains }) => ({
      minutes: workout.durationSeconds / 60,
      pain: pains.length ? Math.max(...pains) : 0,
    })),
  );

  /** Whether a workout is left out because its window is not over yet. */
  hasPending = computed(() => this.linkedWorkouts().hasPending);

  /** Points grouped by rounded duration and pain, with how many workouts share each. */
  bubbles = computed(() => {
    const groups = new Map<string, { x: number; y: number; count: number }>();
    for (const p of this.points()) {
      const x = Math.round(p.minutes / ROUND_MINUTES) * ROUND_MINUTES;
      const key = `${x}:${p.pain}`;
      const group = groups.get(key) ?? { x, y: p.pain, count: 0 };
      group.count++;
      groups.set(key, group);
    }
    return [...groups.values()];
  });

  /**
   * Share of workouts followed by a headache, for workouts longer than the median duration and the rest.
   * Null with too few workouts, or when every workout has the same duration.
   */
  summary = computed(() => {
    const points = this.points();
    if (points.length < MIN_WORKOUTS) return null;

    // Rounded before splitting, so the minutes shown in the summary match the split.
    const sorted = points.map(p => p.minutes).sort((a, b) => a - b);
    const median = Math.round(sorted[Math.floor(sorted.length / 2)]);
    const longer = points.filter(p => p.minutes > median);
    const shorter = points.filter(p => p.minutes <= median);
    if (!longer.length || !shorter.length) return null;

    const percent = (ps: typeof points) => Math.round((ps.filter(p => p.pain > 0).length / ps.length) * 100);
    return { median, longer: percent(longer), shorter: percent(shorter) };
  });

  /** Chart.js data - one bubble per duration and pain, sized by how many workouts it holds. */
  chartData = computed<ChartConfiguration<'bubble'>['data']>(() => ({
    datasets: [{
      data: this.bubbles().map(b => ({ x: b.x, y: b.y, r: 4 + Math.sqrt(b.count) * 3 })),
      backgroundColor: `${CHART_COLOR}99`,
      borderColor: CHART_COLOR_SECONDARY,
    }],
  }));

  /** Duration on x, pain fixed at 0-10 on y, with 0 shown as "None". */
  chartOptions: ChartConfiguration<'bubble'>['options'] = {
    ...baseChartOptions,
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: false },
        title: { display: true, text: 'Workout duration (min)' },
      },
      y: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, callback: value => (value === 0 ? 'None' : value) },
        grid: { display: false },
        title: { display: true, text: 'Highest pain within 24h' },
      },
    },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: item => {
            const b = this.bubbles()[item.dataIndex];
            const pain = b.y === 0 ? 'no headache' : `pain ${b.y}`;
            return `${b.count} ${b.count === 1 ? 'workout' : 'workouts'} of ~${b.x} min, ${pain}`;
          },
        },
      },
    },
  };
}
