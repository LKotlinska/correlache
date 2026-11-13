import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { baseChartOptions, CHART_COLOR } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { addDays, dayKey } from '../../../../utils/date';
import { periodWeeks } from '../../period';
import { ErrorMessage } from '../../../../components/error-message/error-message';

/** Days before each week whose workouts set its training level. */
const LOOKBACK_DAYS = 14;
/** Fewest weeks a level needs before its average is trusted. Levels below it are shown faded. */
const MIN_WEEKS = 3;
/** Difference in headache days per week below which two levels count as about the same. */
const SAME_THRESHOLD = 0.3;

/** Training levels by workouts in the LOOKBACK_DAYS before a week, least active first. */
const LEVELS = [
  { label: 'None', phrase: 'no workouts', max: 0 },
  { label: '1–3', phrase: '1–3 workouts', max: 3 },
  { label: '4+', phrase: '4 or more workouts', max: Infinity },
];

interface LevelAverage {
  label: string;
  phrase: string;
  weeks: number;
  headacheDays: number;
  average: number;
}

@Component({
  imports: [ErrorMessage, BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
  selector: 'app-training-level-headaches',
  styleUrl: './training-level-headaches.scss',
  templateUrl: './training-level-headaches.html',
})
export class TrainingLevelHeadaches {
  readonly minWeeks = MIN_WEEKS;

  private data = inject(InsightsData);

  /** Workouts and headaches shared by the insights charts. */
  workouts = this.data.workouts;
  headaches = this.data.headaches;

  /** The picked range, from the Monday of its oldest week so every week is whole. */
  private shown = this.data.chartPeriod('week');
  periodLabel = this.shown.label;

  /** Headaches from the Monday of the oldest shown week until now. */
  private headacheList = this.data.since('headaches', this.shown.start);
  /** Workouts from LOOKBACK_DAYS before the oldest shown week, so its training level is known. */
  private workoutList = this.data.since('workouts', computed(() => addDays(this.shown.start(), -LOOKBACK_DAYS)));

  /**
   * Each shown week with the workouts in the LOOKBACK_DAYS before it and the days a headache started in it.
   * The current week is left out, as it is not over yet.
   */
  weeks = computed(() => {
    const workoutTimes = this.workoutList().map(w => new Date(w.startedAt).getTime());
    const headacheDates = this.headacheList().map(h => new Date(h.startedAt));

    return periodWeeks(this.shown.period()).slice(0, -1).map(monday => {
      const from = addDays(monday, -LOOKBACK_DAYS).getTime();
      const until = addDays(monday, 7);
      const workoutsBefore = workoutTimes.filter(t => t >= from && t < monday.getTime()).length;
      const days = new Set(headacheDates.filter(d => d >= monday && d < until).map(dayKey));
      return { workoutsBefore, headacheDays: days.size };
    });
  });

  hasEntries = computed(() => this.weeks().some(w => w.workoutsBefore || w.headacheDays));

  /** Average headache days per week at each training level, leaving out levels with no weeks. */
  levelAverages = computed(() =>
    LEVELS.map((level, i) => {
      const min = i === 0 ? 0 : LEVELS[i - 1].max + 1;
      const weeks = this.weeks().filter(w => w.workoutsBefore >= min && w.workoutsBefore <= level.max);
      const headacheDays = weeks.reduce((sum, w) => sum + w.headacheDays, 0);
      const average = weeks.length ? Math.round((headacheDays / weeks.length) * 10) / 10 : 0;
      return { label: level.label, phrase: level.phrase, weeks: weeks.length, headacheDays, average };
    }).filter(l => l.weeks > 0),
  );

  /** Most active level compared with the least active, or null unless two levels have enough weeks. */
  summary = computed(() => {
    const trusted = this.levelAverages().filter(l => l.weeks >= MIN_WEEKS);
    if (trusted.length < 2) return null;
    const quiet = trusted[0];
    const active = trusted[trusted.length - 1];
    const diff = active.average - quiet.average;
    const trend: 'fewer' | 'more' | 'same' = Math.abs(diff) < SAME_THRESHOLD ? 'same' : diff < 0 ? 'fewer' : 'more';
    return { quiet, active, trend };
  });

  /** Chart.js data - one bar per training level. Levels with few weeks are faded. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const levels = this.levelAverages();
    return {
      labels: levels.map(l => l.label),
      datasets: [{
        data: levels.map(l => l.average),
        backgroundColor: levels.map(l => (l.weeks >= MIN_WEEKS ? CHART_COLOR : `${CHART_COLOR}55`)),
        borderRadius: 4,
      }],
    };
  });

  /** Vertical bars (training level on x). The tooltip shows how many weeks each average is based on. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Headache days per week' } },
      x: { grid: { display: false }, title: { display: true, text: 'Workouts in the 2 weeks before' } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: item => {
            const l = this.levelAverages()[item.dataIndex];
            const few = l.weeks < MIN_WEEKS ? ' - too few to compare' : '';
            return `${l.average} headache days per week over ${l.weeks} weeks${few}`;
          },
        },
      },
    },
  };
}
