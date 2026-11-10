import { Component, computed, inject, linkedSignal } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { TrackingMode } from '../../../../models/workout.model';
import { sessionValue } from '../../../../utils/exercise-metric';
import { Period } from '../../period';

const DEFAULT_PERIOD: Period = { unit: 'month', count: 6 };

/** What is plotted for each tracking mode: the best set of a session, or the session's average speed. */
const METRICS: Record<TrackingMode, { label: string; unit: string }> = {
  weight_reps: { label: 'Heaviest set', unit: 'kg' },
  reps: { label: 'Most reps in a set', unit: 'reps' },
  duration: { label: 'Longest set', unit: 's' },
  duration_distance: { label: 'Average speed', unit: 'km/h' },
};

interface ExerciseOption {
  /** Library id, or the name for exercises no longer in the library. */
  key: string;
  name: string;
  /** Mode of the newest session. Sessions tracked in another mode are left out, as their values don't compare. */
  mode: TrackingMode;
  /** Mode whose metric is plotted: reps for weight_reps exercises logged without any weight, such as pull-ups. */
  plotMode: TrackingMode;
  /** Sessions tracked in `mode`. */
  sessions: number;
}

@Component({
  imports: [
    BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar,
    MatFormField, MatLabel, MatInput, MatAutocomplete, MatAutocompleteTrigger, MatOption,
  ],
  selector: 'app-exercise-progress',
  styleUrl: './exercise-progress.scss',
  templateUrl: './exercise-progress.html',
})
export class ExerciseProgress {
  /** Short date for session labels, e.g. "3 Nov". */
  private dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

  private data = inject(InsightsData);

  /** Workouts shared by the insights charts. */
  workouts = this.data.workouts;

  /** The picked range, or the last 6 months. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD);
  periodLabel = this.shown.label;

  /** Workouts from the first shown day until now, newest first. */
  list = this.data.since('workouts', this.shown.start);

  /** Every exercise done in the period, most often done first. */
  exercises = computed(() => {
    const options = new Map<string, ExerciseOption>();
    const weighted = new Set<string>();
    // Workouts arrive newest first, so the first time an exercise is seen gives its current mode.
    for (const w of this.list()) {
      for (const e of w.exercises) {
        const key = this.keyOf(e);
        let option = options.get(key);
        if (!option) {
          option = { key, name: e.exerciseName, mode: e.trackingMode, plotMode: e.trackingMode, sessions: 0 };
          options.set(key, option);
        }
        if (e.trackingMode !== option.mode) continue;
        option.sessions++;
        if (e.sets.some(s => (s.weight ?? 0) > 0)) weighted.add(key);
      }
    }
    for (const option of options.values()) {
      if (option.mode === 'weight_reps' && !weighted.has(option.key)) option.plotMode = 'reps';
    }
    return [...options.values()].sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name));
  });

  /** Picked exercise key. Resets to the most done exercise when the list changes. */
  selectedKey = linkedSignal(() => this.exercises()[0]?.key ?? null);

  selected = computed(() => this.exercises().find(e => e.key === this.selectedKey()) ?? null);

  /** Text in the exercise field. Shows the picked exercise's name until the user types. */
  query = linkedSignal(() => this.selected()?.name ?? '');

  /** Exercises whose name contains the typed text. All of them while the field still shows the picked name. */
  filteredExercises = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (query === this.selected()?.name.toLowerCase()) return this.exercises();
    return this.exercises().filter(e => e.name.toLowerCase().includes(query));
  });

  /** Shows the exercise's name in the field after an option, whose value is the key, is picked. */
  nameOf = (key: string | null) => this.exercises().find(e => e.key === key)?.name ?? '';

  select(key: string) {
    this.selectedKey.set(key);
    this.query.set(this.nameOf(key));
  }

  /** Puts the picked exercise's name back when the field is left with typed text that wasn't picked. */
  resetQuery() {
    this.query.set(this.selected()?.name ?? '');
  }

  metric = computed(() => {
    const exercise = this.selected();
    return exercise ? METRICS[exercise.plotMode] : null;
  });

  /** Oldest to newest, one point per session of the picked exercise that has a value. */
  points = computed(() => {
    const exercise = this.selected();
    if (!exercise) return [];

    const points: { date: Date; value: number }[] = [];
    for (const w of this.list()) {
      for (const e of w.exercises) {
        if (this.keyOf(e) !== exercise.key || e.trackingMode !== exercise.mode) continue;
        const value = sessionValue(exercise.plotMode, e.sets);
        if (value !== null) points.push({ date: new Date(w.startedAt), value });
      }
    }
    return points.reverse();
  });

  /** Best value and change from the first to the newest session, or null with fewer than two sessions. */
  summary = computed(() => {
    const points = this.points();
    const metric = this.metric();
    if (points.length < 2 || !metric) return null;

    const change = points[points.length - 1].value - points[0].value;
    return {
      best: this.format(Math.max(...points.map(p => p.value)), metric.unit),
      change: `${change >= 0 ? '+' : '−'}${this.format(Math.abs(change), metric.unit)}`,
      since: this.dateFmt.format(points[0].date),
      improved: change > 0,
    };
  });

  /** Chart.js data - one point per session. */
  chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const points = this.points();
    return {
      labels: points.map(p => this.dateFmt.format(p.date)),
      datasets: [{
        data: points.map(p => p.value),
        borderColor: CHART_COLOR,
        backgroundColor: CHART_COLOR,
        pointRadius: 4,
        tension: 0.3,
      }],
    };
  });

  /** Rebuilt per exercise so the tooltip and, for durations, the y-axis show the right unit. */
  chartOptions = computed<ChartConfiguration<'line'>['options']>(() => {
    const metric = this.metric();
    return {
      ...baseChartOptions,
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
        y: {
          beginAtZero: false,
          grid: { display: false },
          ticks: metric?.unit === 's' ? { callback: value => this.format(Number(value), 's') } : {},
        },
      },
      plugins: {
        ...baseChartOptions.plugins,
        tooltip: {
          callbacks: {
            label: item => `${metric?.label}: ${this.format(item.parsed.y ?? 0, metric?.unit ?? '')}`,
          },
        },
      },
    };
  });

  /** e.g. "62.5 kg", "12 reps", "1:30" for seconds, "10.4 km/h". */
  private format(value: number, unit: string) {
    if (unit === 's') {
      const seconds = Math.round(value);
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${Math.round(value * 10) / 10} ${unit}`;
  }

  private keyOf(e: { exerciseId: number | null; exerciseName: string }) {
    return e.exerciseId !== null ? String(e.exerciseId) : `name:${e.exerciseName}`;
  }
}
