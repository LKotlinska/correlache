import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { baseChartOptions, CHART_COLOR } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { addDays } from '../../../../utils/date';
import { ErrorMessage } from '../../../../components/error-message/error-message';

/** Days before the first shown day searched for the workout before each headache. */
const LOOKBACK_DAYS = 28;
const HOUR_MS = 60 * 60 * 1000;
/** Headaches starting up to this many hours after a workout count as "within a day" in the summary. */
const SUMMARY_HOURS = 24;

/** Upper bound in hours of each bucket, in order. Headaches over 2 days after a workout, or with none, are in no bucket. */
const BUCKETS = [
  { label: 'Under 2h', maxHours: 2 },
  { label: '2–6h', maxHours: 6 },
  { label: '6–12h', maxHours: 12 },
  { label: '12–24h', maxHours: 24 },
  { label: '1–2 days', maxHours: 48 },
];

@Component({
  imports: [ErrorMessage, BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
  selector: 'app-time-since-workout',
  styleUrl: './time-since-workout.scss',
  templateUrl: './time-since-workout.html',
})
export class TimeSinceWorkout {
  private data = inject(InsightsData);

  /** Workouts and headaches shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;

  /** The picked range. */
  private shown = this.data.chartPeriod();
  periodLabel = this.shown.label;

  /** Headaches from the first shown day until now. */
  list = this.data.since('headaches', this.shown.start);

  /** Workouts from LOOKBACK_DAYS before the first shown day, so early headaches can find the workout before them. */
  private workoutList = this.data.since('workouts', computed(() => addDays(this.shown.start(), -LOOKBACK_DAYS)));

  /**
   * Hours from the end of the latest workout started before each headache, or null when there is none
   * within LOOKBACK_DAYS before the first shown day. A headache starting during a workout counts as 0 hours.
   */
  hoursSinceWorkout = computed(() => {
    const workouts = this.workoutList().map(w => {
      const start = new Date(w.startedAt).getTime();
      return { start, end: start + w.durationSeconds * 1000 };
    });

    return this.list().map(h => {
      const headacheStart = new Date(h.startedAt).getTime();
      let latest: (typeof workouts)[number] | null = null;
      for (const w of workouts) {
        if (w.start <= headacheStart && (!latest || w.start > latest.start)) latest = w;
      }
      return latest ? Math.max(0, (headacheStart - latest.end) / HOUR_MS) : null;
    });
  });

  /** Number of headaches in each bucket, in BUCKETS order. Headaches over 2 days after a workout, or with none, are skipped. */
  bucketCounts = computed(() => {
    const counts = BUCKETS.map(() => 0);
    for (const hours of this.hoursSinceWorkout()) {
      const bucket = hours === null ? -1 : BUCKETS.findIndex(b => hours < b.maxHours);
      if (bucket >= 0) counts[bucket]++;
    }
    return counts;
  });

  /** How many headaches started within SUMMARY_HOURS after a workout, out of all shown. */
  summary = computed(() => {
    const hours = this.hoursSinceWorkout();
    return {
      withinDay: hours.filter(h => h !== null && h < SUMMARY_HOURS).length,
      total: hours.length,
    };
  });

  /** Chart.js data - one bar per time bucket. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => ({
    labels: BUCKETS.map(b => b.label),
    datasets: [{
      data: this.bucketCounts(),
      backgroundColor: CHART_COLOR,
      borderRadius: 4,
    }],
  }));

  /** Vertical bars (time since workout on x) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    scales: {
      x: { grid: { display: false }, title: { display: true, text: 'Time since last workout' } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: item => `${item.parsed.y} ${item.parsed.y === 1 ? 'headache' : 'headaches'}`,
        },
      },
    },
  };
}
