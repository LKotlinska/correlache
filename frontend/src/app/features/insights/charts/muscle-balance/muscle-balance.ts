import { Component, computed, inject } from '@angular/core';
import { WorkoutService } from '../../../../services/workout.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { baseRadarOptions, CHART_COLOR } from '../../chart-defaults';
import { addDays, startOfWeek } from '../../../../utils/date';
import { MuscleRole } from '../../../../models/workout.model';

const WEEKS_SHOWN = 4;

/** How much one set counts towards a muscle group, by the muscle's role in the exercise. */
const ROLE_WEIGHT: Record<MuscleRole, number> = { primary: 1, secondary: 0.5 };

/** Muscle groups left off the chart, as they are not muscles you balance. */
const HIDDEN_GROUPS = new Set(['Cardio']);

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-muscle-balance',
  styleUrl: './muscle-balance.scss',
  templateUrl: './muscle-balance.html',
})
export class MuscleBalance {
  private workoutService = inject(WorkoutService);

  /** Workouts from the Monday WEEKS_SHOWN weeks ago, and the exercise library for each exercise's muscles. */
  data = rxResource({
    stream: () => forkJoin({
      workouts: this.workoutService.getWorkouts({ from: addDays(startOfWeek(new Date()), -7 * (WEEKS_SHOWN - 1)) }),
      exercises: this.workoutService.getExercises(),
    }),
  })

  /** Every muscle group in the library, in id order, with its weighted set count. */
  groupSets = computed(() => {
    const data = this.data.value();
    if (!data) return [];

    const groups = new Map<number, { name: string; sets: number }>();
    // Weight per muscle group for each library exercise. A group hit by several of its muscles counts once, at its highest role.
    const weightsByExercise = new Map<number, Map<number, number>>();
    for (const exercise of data.exercises) {
      const weights = new Map<number, number>();
      for (const m of exercise.muscles) {
        if (HIDDEN_GROUPS.has(m.muscleGroup.name)) continue;
        groups.set(m.muscleGroup.id, { name: m.muscleGroup.name, sets: 0 });
        weights.set(m.muscleGroup.id, Math.max(weights.get(m.muscleGroup.id) ?? 0, ROLE_WEIGHT[m.role]));
      }
      weightsByExercise.set(exercise.id, weights);
    }

    // Exercises no longer in the library have no muscles, so they are skipped.
    for (const w of data.workouts) {
      for (const e of w.exercises) {
        for (const [groupId, weight] of weightsByExercise.get(e.exerciseId) ?? []) {
          groups.get(groupId)!.sets += weight * e.sets.length;
        }
      }
    }

    return [...groups.entries()].sort(([a], [b]) => a - b).map(([, g]) => g);
  });

  /** Most trained group and the groups with no sets, or null without any sets. */
  summary = computed(() => {
    const groups = this.groupSets();
    const most = groups.reduce<{ name: string; sets: number } | null>((a, b) => (!a || b.sets > a.sets ? b : a), null);
    if (!most || most.sets === 0) return null;
    return {
      most: most.name,
      untrained: this.joinNames(groups.filter(g => g.sets === 0).map(g => g.name)),
    };
  });

  /** Chart.js data - one axis per muscle group. */
  chartData = computed<ChartConfiguration<'radar'>['data']>(() => {
    const groups = this.groupSets();
    return {
      labels: groups.map(g => g.name),
      datasets: [{
        data: groups.map(g => g.sets),
        borderColor: CHART_COLOR,
        backgroundColor: `${CHART_COLOR}33`,
        pointBackgroundColor: CHART_COLOR,
      }],
    };
  });

  /** Scale starts at zero with hidden tick numbers, as the shape matters more than exact counts. */
  chartOptions: ChartConfiguration<'radar'>['options'] = {
    ...baseRadarOptions,
    scales: {
      r: { beginAtZero: true, ticks: { display: false } },
    },
    plugins: {
      ...baseRadarOptions?.plugins,
      tooltip: {
        callbacks: {
          label: item => `${Math.round(item.parsed.r * 10) / 10} sets`,
        },
      },
    },
  };

  /** "A", "A and B", "A, B and C". */
  private joinNames(names: string[]) {
    return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  }
}
