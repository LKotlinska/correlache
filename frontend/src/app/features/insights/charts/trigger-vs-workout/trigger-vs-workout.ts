import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { addDays } from '../../../../utils/date';
import { Period } from '../../period';

const DEFAULT_PERIOD: Period = { unit: 'month', count: 3 };
/** Triggers that point to exercise. */
const EXERCISE_TRIGGERS = new Set(['Cardio', 'Physical strain']);
/** Fewest headaches with an exercise trigger needed before the counts are compared. */
const MIN_TAGGED = 3;
/** A headache is linked to a workout when it starts from the workout's start until this long after its end. */
const WINDOW_MS = 24 * 60 * 60 * 1000;

/** What each bar counts, in the order of the bars. */
const BAR_DESCRIPTIONS = [
  'headaches tagged, after a workout',
  'headaches tagged, no workout',
  'headaches not tagged, after a workout',
];

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-trigger-vs-workout',
  styleUrl: './trigger-vs-workout.scss',
  templateUrl: './trigger-vs-workout.html',
})
export class TriggerVsWorkout {
  readonly minTagged = MIN_TAGGED;

  private data = inject(InsightsData);

  /** Workouts and headaches shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;

  /** The picked range, or the last 3 months. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD);
  periodLabel = this.shown.label;

  /** Headaches from the first shown day until now. */
  private headacheList = this.data.since('headaches', this.shown.start);

  /** Workouts from a day before the first shown day, so the first headaches can still be linked to one. */
  private workoutFrom = computed(() => addDays(this.shown.start(), -1));
  private workoutList = this.data.since('workouts', this.workoutFrom);

  /**
   * Headaches tagged Cardio or Physical strain, split by whether a workout was logged before them,
   * and the untagged headaches that followed a workout anyway.
   */
  counts = computed(() => {
    const windows = this.workoutList().map(w => {
      const start = new Date(w.startedAt).getTime();
      return { start, until: start + w.durationSeconds * 1000 + WINDOW_MS };
    });

    let taggedWithWorkout = 0;
    let taggedWithoutWorkout = 0;
    let untaggedWithWorkout = 0;
    for (const h of this.headacheList()) {
      const start = new Date(h.startedAt).getTime();
      const afterWorkout = windows.some(w => start >= w.start && start < w.until);
      const tagged = (h.triggers ?? []).some(t => EXERCISE_TRIGGERS.has(t.name));

      if (tagged) afterWorkout ? taggedWithWorkout++ : taggedWithoutWorkout++;
      else if (afterWorkout) untaggedWithWorkout++;
    }
    return { taggedWithWorkout, taggedWithoutWorkout, untaggedWithWorkout };
  });

  /** Headaches with an exercise trigger. */
  tagged = computed(() => this.counts().taggedWithWorkout + this.counts().taggedWithoutWorkout);

  /** Whether enough headaches have an exercise trigger to be worth comparing. */
  enoughData = computed(() => this.tagged() >= MIN_TAGGED);

  /** Share of tagged headaches that followed a logged workout, as a whole percentage. */
  taggedWithWorkoutPercent = computed(() => Math.round((this.counts().taggedWithWorkout / this.tagged()) * 100));

  /** Chart.js data - one bar per group of headaches. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const { taggedWithWorkout, taggedWithoutWorkout, untaggedWithWorkout } = this.counts();
    return {
      labels: [['Tagged', 'after workout'], ['Tagged', 'no workout'], ['Not tagged', 'after workout']],
      datasets: [{
        data: [taggedWithWorkout, taggedWithoutWorkout, untaggedWithWorkout],
        backgroundColor: [CHART_COLOR, CHART_COLOR_SECONDARY, `${CHART_COLOR}66`],
        borderRadius: 4,
      }],
    };
  });

  /** The tooltip spells out what each bar counts. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        callbacks: {
          title: () => '',
          label: item => `${item.parsed.y} ${BAR_DESCRIPTIONS[item.dataIndex]}`,
        },
      },
    },
  };
}
