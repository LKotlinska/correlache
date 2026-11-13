import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { baseChartOptions, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { weekIndex } from '../../../../utils/date';
import { periodWeeks } from '../../period';
import { ErrorMessage } from '../../../../components/error-message/error-message';

/** Recent weeks compared against the rest of the period in the summary. */
const RECENT_WEEKS = 4;

@Component({
  imports: [ErrorMessage, BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
  selector: 'app-pain-over-time',
  styleUrl: './pain-over-time.scss',
  templateUrl: './pain-over-time.html',
})
export class PainOverTime {
  /** Short date for week labels, e.g. "3 Nov". */
  private weekFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

  private data = inject(InsightsData);

  /** Headaches shared by the insights charts. */
  headaches = this.data.headaches;

  /** The picked range, from the Monday of its oldest week so every week is whole. */
  private shown = this.data.chartPeriod('week');
  periodLabel = this.shown.label;

  /** Monday of each shown week, oldest first, starting with the week holding the period's first day. */
  private weekStarts = computed(() => periodWeeks(this.shown.period()));

  /** Headaches from the first shown Monday until now. */
  list = this.data.since('headaches', this.shown.start);

  /** Oldest to newest, one entry per week. `average` is null for weeks without headaches. */
  weeklyPain = computed(() => {
    const mondays = this.weekStarts();
    const weeks = mondays.map(date => ({ date, total: 0, count: 0 }));

    for (const h of this.list()) {
      const week = weeks[weekIndex(mondays, new Date(h.startedAt))];
      if (!week) continue;
      week.total += h.painLevel;
      week.count++;
    }

    return weeks.map(w => ({ date: w.date, average: w.count ? w.total / w.count : null }));
  });

  /** Average pain over the whole period, and whether the last RECENT_WEEKS were milder or worse than before. */
  summary = computed(() => {
    const list = this.list();
    if (list.length === 0) return null;

    const recentFrom = this.weeklyPain().at(-RECENT_WEEKS)?.date ?? this.weekStarts()[0];
    const recent = list.filter(h => new Date(h.startedAt) >= recentFrom);
    const earlier = list.filter(h => new Date(h.startedAt) < recentFrom);

    const avg = (hs: typeof list) => hs.reduce((sum, h) => sum + h.painLevel, 0) / hs.length;
    const recentAvg = recent.length ? avg(recent) : null;
    const earlierAvg = earlier.length ? avg(earlier) : null;

    let trend: 'lower' | 'higher' | 'same' | null = null;
    if (recentAvg !== null && earlierAvg !== null) {
      const diff = recentAvg - earlierAvg;
      trend = Math.abs(diff) < 0.5 ? 'same' : diff < 0 ? 'lower' : 'higher';
    }

    return { average: avg(list).toFixed(1), trend };
  });

  /** Chart.js data - one point per week, with the line bridging weeks without headaches. */
  chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const weeks = this.weeklyPain();
    return {
      labels: weeks.map(w => this.weekFmt.format(w.date)),
      datasets: [{
        data: weeks.map(w => w.average),
        borderColor: CHART_COLOR_SECONDARY,
        backgroundColor: CHART_COLOR_SECONDARY,
        pointRadius: 4,
        tension: 0.3,
        spanGaps: true,
      }],
    };
  });

  /** Pain scale fixed at 1-10 so weeks are comparable at a glance. */
  chartOptions: ChartConfiguration<'line'>['options'] = {
    ...baseChartOptions,
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
      y: { min: 1, max: 10, ticks: { stepSize: 1 }, grid: { display: false } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        callbacks: {
          title: items => `Week of ${items[0].label}`,
          label: item => `Average pain: ${(item.parsed.y ?? 0).toFixed(1)}`,
        },
      },
    },
  };
}
