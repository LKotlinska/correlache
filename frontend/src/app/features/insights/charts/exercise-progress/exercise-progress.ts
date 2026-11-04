import { Component, computed, inject, linkedSignal } from '@angular/core';
import { WorkoutService } from '../../../../services/workout.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseLineOptions, CHART_COLOR } from '../../chart-defaults';
import { TrackingMode, WorkoutSet } from '../../../../models/workout.model';

const MONTHS_SHOWN = 6;

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
  sessions: number;
}

@Component({
  imports: [
    BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar,
    MatFormField, MatLabel, MatSelect, MatOption,
  ],
  selector: 'app-exercise-progress',
  styleUrl: './exercise-progress.scss',
  templateUrl: './exercise-progress.html',
})
export class ExerciseProgress {
  private workoutService = inject(WorkoutService);

  /** Short date for session labels, e.g. "3 Nov". */
  private dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

  /** Workouts from the first day of the oldest shown month until now, newest first. */
  workouts = rxResource({
    stream: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1), 1);
      return this.workoutService.getWorkouts({ from });
    },
  })

  /** Every exercise done in the period, most often done first. */
  exercises = computed(() => {
    const options = new Map<string, ExerciseOption>();
    // Workouts arrive newest first, so the first time an exercise is seen gives its current mode.
    for (const w of this.workouts.value() ?? []) {
      for (const e of w.exercises) {
        const key = this.keyOf(e);
        const option = options.get(key);
        if (option) option.sessions++;
        else options.set(key, { key, name: e.exerciseName, mode: e.trackingMode, sessions: 1 });
      }
    }
    return [...options.values()].sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name));
  });

  /** Picked exercise key. Resets to the most done exercise when the list changes. */
  selectedKey = linkedSignal(() => this.exercises()[0]?.key ?? null);

  selected = computed(() => this.exercises().find(e => e.key === this.selectedKey()) ?? null);

  metric = computed(() => {
    const exercise = this.selected();
    return exercise ? METRICS[exercise.mode] : null;
  });

  /** Oldest to newest, one point per session of the picked exercise that has a value. */
  points = computed(() => {
    const exercise = this.selected();
    if (!exercise) return [];

    const points: { date: Date; value: number }[] = [];
    for (const w of this.workouts.value() ?? []) {
      for (const e of w.exercises) {
        if (this.keyOf(e) !== exercise.key || e.trackingMode !== exercise.mode) continue;
        const value = this.sessionValue(exercise.mode, e.sets);
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

  /** Rebuilt per exercise so the tooltip shows the right unit. */
  chartOptions = computed<ChartConfiguration<'line'>['options']>(() => {
    const metric = this.metric();
    return {
      ...baseLineOptions,
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
        y: { beginAtZero: false, grid: { display: false } },
      },
      plugins: {
        ...baseLineOptions?.plugins,
        tooltip: {
          callbacks: {
            label: item => `${metric?.label}: ${this.format(item.parsed.y ?? 0, metric?.unit ?? '')}`,
          },
        },
      },
    };
  });

  /** The plotted value for one session, or null when its sets hold nothing for the mode. */
  private sessionValue(mode: TrackingMode, sets: WorkoutSet[]): number | null {
    if (mode === 'duration_distance') {
      // Total distance over total time, like exerciseVolume() in the backend.
      const km = sets.reduce((sum, s) => sum + (s.distance ?? 0), 0);
      const seconds = sets.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
      return km > 0 && seconds > 0 ? km / (seconds / 3600) : null;
    }

    const field = mode === 'weight_reps' ? 'weight' : mode === 'reps' ? 'reps' : 'durationSeconds';
    const values = sets.map(s => s[field]).filter((v): v is number => v !== null && v > 0);
    return values.length ? Math.max(...values) : null;
  }

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
