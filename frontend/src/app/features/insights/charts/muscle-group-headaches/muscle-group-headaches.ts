import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { addDays, startOfWeek } from '../../../../utils/date';

const WEEKS_SHOWN = 8;
const HOUR_MS = 60 * 60 * 1000;
/** Headaches starting up to this many hours after a workout ends are linked to it. */
const WINDOW_HOURS = 24;
/** Fewest workouts a muscle group needs before its rate is trusted. Groups below it are shown faded. */
const MIN_WORKOUTS = 3;
/** Height of one bar row in pixels, so the chart grows with the number of muscle groups. */
const ROW_HEIGHT = 28;

interface GroupRate {
  name: string;
  workouts: number;
  withHeadache: number;
  percent: number;
}

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-muscle-group-headaches',
  styleUrl: './muscle-group-headaches.scss',
  templateUrl: './muscle-group-headaches.html',
})
export class MuscleGroupHeadaches {
  readonly minWorkouts = MIN_WORKOUTS;

  private data = inject(InsightsData);

  /** Workouts, headaches and the exercise library shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;
  exercises = this.data.exercises;

  hasData = computed(() => this.workouts.hasValue() && this.headaches.hasValue() && this.exercises.hasValue());

  hasError = computed(() => !!this.workouts.error() || !!this.headaches.error() || !!this.exercises.error());

  /**
   * Each workout from the oldest shown Monday whose window is over, with the muscle groups its exercises
   * work as a primary muscle, and whether a headache started from its start until WINDOW_HOURS after it ended.
   */
  sessions = computed(() => {
    const from = addDays(startOfWeek(new Date()), -7 * (WEEKS_SHOWN - 1)).getTime();
    const now = Date.now();
    const headacheStarts = (this.headaches.value() ?? []).map(h => new Date(h.startedAt).getTime());

    // Primary muscle groups of each library exercise. Exercises no longer in the library have none.
    const groupsByExercise = new Map<number, { id: number; name: string }[]>();
    for (const exercise of this.exercises.value() ?? []) {
      groupsByExercise.set(exercise.id, exercise.muscles.filter(m => m.role === 'primary').map(m => m.muscleGroup));
    }

    return (this.workouts.value() ?? []).flatMap(w => {
      const start = new Date(w.startedAt).getTime();
      const until = start + w.durationSeconds * 1000 + WINDOW_HOURS * HOUR_MS;
      if (start < from || until > now) return [];

      const groups = new Map<number, string>();
      for (const e of w.exercises) {
        for (const g of groupsByExercise.get(e.exerciseId) ?? []) groups.set(g.id, g.name);
      }
      return [{ groups, headache: headacheStarts.some(h => h >= start && h < until) }];
    });
  });

  /** Headache rate after all shown workouts, the baseline each muscle group is compared with. */
  overall = computed<GroupRate>(() => this.rate('All workouts', this.sessions()));

  /** Headache rate per muscle group trained in the shown workouts, highest first. */
  groupRates = computed(() => {
    const byGroup = new Map<number, { name: string; sessions: { headache: boolean }[] }>();
    for (const s of this.sessions()) {
      for (const [id, name] of s.groups) {
        const group = byGroup.get(id) ?? { name, sessions: [] };
        group.sessions.push(s);
        byGroup.set(id, group);
      }
    }
    return [...byGroup.values()]
      .map(g => this.rate(g.name, g.sessions))
      .sort((a, b) => b.percent - a.percent || b.workouts - a.workouts);
  });

  /** Muscle group with the highest rate among those with enough workouts, or null when none has enough. */
  summary = computed(() => {
    const top = this.groupRates().find(g => g.workouts >= MIN_WORKOUTS);
    return top ? { top, overall: this.overall() } : null;
  });

  /** Chart height in pixels: one row per bar plus room for the axis. */
  chartHeight = computed(() => (this.groupRates().length + 1) * ROW_HEIGHT + 40);

  /** Chart.js data - an "All workouts" baseline bar, then one bar per muscle group. Groups with few workouts are faded. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const rows = [this.overall(), ...this.groupRates()];
    return {
      labels: rows.map(r => r.name),
      datasets: [{
        data: rows.map(r => r.percent),
        backgroundColor: rows.map((r, i) =>
          i === 0 ? CHART_COLOR_SECONDARY : r.workouts >= MIN_WORKOUTS ? CHART_COLOR : `${CHART_COLOR}55`,
        ),
        borderRadius: 4,
      }],
    };
  });

  /** Horizontal bars (muscle groups on y), with percentages fixed at 0-100. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    indexAxis: 'y',
    scales: {
      x: { min: 0, max: 100, ticks: { callback: value => `${value}%` }, grid: { display: false } },
      y: { grid: { display: false } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: item => {
            const r = [this.overall(), ...this.groupRates()][item.dataIndex];
            const few = item.dataIndex > 0 && r.workouts < MIN_WORKOUTS ? ' - too few to compare' : '';
            return `${r.withHeadache} of ${r.workouts} workouts (${r.percent}%)${few}`;
          },
        },
      },
    },
  };

  private rate(name: string, sessions: { headache: boolean }[]): GroupRate {
    const withHeadache = sessions.filter(s => s.headache).length;
    const percent = sessions.length ? Math.round((withHeadache / sessions.length) * 100) : 0;
    return { name, workouts: sessions.length, withHeadache, percent };
  }
}
