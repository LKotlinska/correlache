import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { addDays, startOfWeek } from '../../../../utils/date';

const WEEKS_SHOWN = 8;
const HOUR_MS = 60 * 60 * 1000;
/** Headaches starting up to this many hours after a workout ends are linked to it. */
const WINDOW_HOURS = 24;
/** Durations are rounded to this many minutes, so similar workouts share one bubble. */
const ROUND_MINUTES = 5;
/** Fewest workouts needed before the summary compares longer and shorter ones. */
const MIN_WORKOUTS = 6;

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-intensity-vs-pain',
  styleUrl: './intensity-vs-pain.scss',
  templateUrl: './intensity-vs-pain.html',
})
export class IntensityVsPain {
  private data = inject(InsightsData);

  /** Workouts and headaches shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;

  /**
   * Each workout from the oldest shown Monday whose window is over, with its duration in minutes
   * and the highest pain of headaches starting from its start until WINDOW_HOURS after it ended (0 for none).
   */
  points = computed(() => {
    const from = addDays(startOfWeek(new Date()), -7 * (WEEKS_SHOWN - 1)).getTime();
    const now = Date.now();
    const headaches = (this.headaches.value() ?? []).map(h => ({ start: new Date(h.startedAt).getTime(), pain: h.painLevel }));

    return (this.workouts.value() ?? []).flatMap(w => {
      const start = new Date(w.startedAt).getTime();
      const until = start + w.durationSeconds * 1000 + WINDOW_HOURS * HOUR_MS;
      if (start < from || until > now) return [];

      const pains = headaches.filter(h => h.start >= start && h.start < until).map(h => h.pain);
      return [{ minutes: w.durationSeconds / 60, pain: pains.length ? Math.max(...pains) : 0 }];
    });
  });

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

  /** Whether a workout from the oldest shown Monday is left out because its window is not over yet. */
  hasPending = computed(() => {
    const from = addDays(startOfWeek(new Date()), -7 * (WEEKS_SHOWN - 1)).getTime();
    const now = Date.now();
    return (this.workouts.value() ?? []).some(w => {
      const start = new Date(w.startedAt).getTime();
      return start >= from && start + w.durationSeconds * 1000 + WINDOW_HOURS * HOUR_MS > now;
    });
  });

  /** Chart.js data - one bubble per duration and pain, sized by how many workouts it holds. */
  chartData = computed<ChartConfiguration<'bubble'>['data']>(() => ({
    datasets: [{
      data: this.bubbles().map(b => ({ x: b.x, y: b.y, r: 4 + Math.sqrt(b.count) * 3 })),
      backgroundColor: `${CHART_COLOR}99`,
      borderColor: CHART_COLOR,
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
