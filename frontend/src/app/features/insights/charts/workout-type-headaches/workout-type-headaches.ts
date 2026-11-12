import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { Period } from '../../period';
import { TrackingMode, Workout } from '../../../../models/workout.model';
import { ErrorMessage } from '../../../../components/error-message/error-message';

const DEFAULT_PERIOD: Period = { unit: 'week', count: 8 };
/** Fewest workouts a type needs before its rate is trusted. Types below it are shown faded. */
const MIN_WORKOUTS = 3;
/** Difference in percentage points below which strength and cardio count as about the same. */
const SAME_THRESHOLD = 10;

type WorkoutType = 'Strength' | 'Cardio' | 'Mixed';

/** Tracking modes that count as strength. The rest (duration, duration_distance) count as cardio. */
const STRENGTH_MODES = new Set<TrackingMode>(['weight_reps', 'reps']);

/** Bar order after the "All workouts" baseline. */
const TYPES: WorkoutType[] = ['Strength', 'Cardio', 'Mixed'];

interface TypeRate {
  name: string;
  workouts: number;
  withHeadache: number;
  percent: number;
}

/** Strength or cardio when every exercise is one kind, Mixed when both, or null for a workout without exercises. */
function workoutType(workout: Workout): WorkoutType | null {
  if (!workout.exercises.length) return null;
  const strength = workout.exercises.filter(e => STRENGTH_MODES.has(e.trackingMode)).length;
  if (strength === workout.exercises.length) return 'Strength';
  return strength === 0 ? 'Cardio' : 'Mixed';
}

@Component({
  imports: [ErrorMessage, BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
  selector: 'app-workout-type-headaches',
  styleUrl: './workout-type-headaches.scss',
  templateUrl: './workout-type-headaches.html',
})
export class WorkoutTypeHeadaches {
  readonly minWorkouts = MIN_WORKOUTS;

  private data = inject(InsightsData);

  /** Workouts and headaches shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;

  /** The picked range, or the last 8 weeks. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD);
  periodLabel = this.shown.label;

  private linkedWorkouts = this.data.linkedWorkouts(this.shown.start);

  /** Whether a workout is left out because its window is not over yet. */
  hasPending = computed(() => this.linkedWorkouts().hasPending);

  /** Each linked workout with exercises, with its type and whether it had a linked headache. */
  sessions = computed(() =>
    this.linkedWorkouts().linked.flatMap(({ workout, pains }) => {
      const type = workoutType(workout);
      return type ? [{ type, headache: pains.length > 0 }] : [];
    }),
  );

  /** Headache rate after all shown workouts, the baseline each type is compared with. */
  overall = computed<TypeRate>(() => this.rate('All workouts', this.sessions()));

  /** Headache rate per workout type, leaving out types with no workouts. */
  typeRates = computed(() =>
    TYPES.map(type => this.rate(type, this.sessions().filter(s => s.type === type))).filter(r => r.workouts > 0),
  );

  /** Strength compared with cardio, or null unless both have enough workouts. */
  summary = computed(() => {
    const strength = this.typeRates().find(r => r.name === 'Strength');
    const cardio = this.typeRates().find(r => r.name === 'Cardio');
    if (!strength || !cardio || strength.workouts < MIN_WORKOUTS || cardio.workouts < MIN_WORKOUTS) return null;
    const diff = strength.percent - cardio.percent;
    const trend: 'strength' | 'cardio' | 'same' =
      Math.abs(diff) < SAME_THRESHOLD ? 'same' : diff > 0 ? 'strength' : 'cardio';
    return { strength, cardio, trend };
  });

  /** Chart.js data - an "All workouts" baseline bar, then one bar per workout type. Types with few workouts are faded. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const rows = [this.overall(), ...this.typeRates()];
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

  /** Percentages fixed at 0-100 so small differences aren't exaggerated. The tooltip shows the workout counts. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    scales: {
      y: { min: 0, max: 100, ticks: { callback: value => `${value}%` } },
      x: { grid: { display: false } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: item => {
            const r = [this.overall(), ...this.typeRates()][item.dataIndex];
            const few = item.dataIndex > 0 && r.workouts < MIN_WORKOUTS ? ' - too few to compare' : '';
            return `${r.withHeadache} of ${r.workouts} workouts (${r.percent}%)${few}`;
          },
        },
      },
    },
  };

  private rate(name: string, sessions: { headache: boolean }[]): TypeRate {
    const withHeadache = sessions.filter(s => s.headache).length;
    const percent = sessions.length ? Math.round((withHeadache / sessions.length) * 100) : 0;
    return { name, workouts: sessions.length, withHeadache, percent };
  }
}
