import { Component, computed, inject } from '@angular/core';
import { HeadacheService } from '../../../../services/headache.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseLineOptions, CHART_COLOR } from '../../chart-defaults';

const MONTHS_SHOWN = 3;
/** Recent weeks compared against the rest of the period in the summary. */
const RECENT_WEEKS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-pain-over-time',
  styleUrl: './pain-over-time.scss',
  templateUrl: './pain-over-time.html',
})
export class PainOverTime {
  private headacheService = inject(HeadacheService);

  /** Short date for week labels, e.g. "3 Nov". */
  private weekFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

  /** Monday of the week containing the first day of the oldest shown month. */
  private start = this.mondayOf(new Date(new Date().getFullYear(), new Date().getMonth() - (MONTHS_SHOWN - 1), 1));

  /** Headaches from the first shown Monday until now. */
  headaches = rxResource({
    stream: () => this.headacheService.getHeadaches({ from: this.start }),
  })

  /** Oldest to newest, one entry per week. `average` is null for weeks without headaches. */
  weeklyPain = computed(() => {
    const list = this.headaches.value() ?? [];
    const weekCount = this.weeksSinceStart(new Date()) + 1;

    const weeks = Array.from({ length: weekCount }, (_, i) => ({
      date: new Date(this.start.getFullYear(), this.start.getMonth(), this.start.getDate() + i * 7),
      total: 0,
      count: 0,
    }));

    for (const h of list) {
      const week = weeks[this.weeksSinceStart(new Date(h.startedAt))];
      if (!week) continue;
      week.total += h.painLevel;
      week.count++;
    }

    return weeks.map(w => ({ date: w.date, average: w.count ? w.total / w.count : null }));
  });

  /** Average pain over the whole period, and whether the last RECENT_WEEKS were milder or worse than before. */
  summary = computed(() => {
    const list = this.headaches.value() ?? [];
    if (list.length === 0) return null;

    const recentFrom = this.weeklyPain().at(-RECENT_WEEKS)?.date ?? this.start;
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
        borderColor: CHART_COLOR,
        backgroundColor: CHART_COLOR,
        pointRadius: 4,
        tension: 0.3,
        spanGaps: true,
      }],
    };
  });

  /** Pain scale fixed at 1-10 so weeks are comparable at a glance. */
  chartOptions: ChartConfiguration<'line'>['options'] = {
    ...baseLineOptions,
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
      y: { min: 1, max: 10, ticks: { stepSize: 1 }, grid: { display: false } },
    },
    plugins: {
      ...baseLineOptions?.plugins,
      tooltip: {
        callbacks: {
          title: items => `Week of ${items[0].label}`,
          label: item => `Average pain: ${(item.parsed.y ?? 0).toFixed(1)}`,
        },
      },
    },
  };

  /** Index of `d`'s week from the first shown Monday. Days are rounded, as daylight saving time makes some weeks an hour shorter or longer. */
  private weeksSinceStart(d: Date) {
    const days = Math.round((this.mondayOf(d).getTime() - this.start.getTime()) / DAY_MS);
    return Math.floor(days / 7);
  }

  /** Midnight on the Monday of `d`'s week. */
  private mondayOf(d: Date) {
    const daysSinceMonday = (d.getDay() + 6) % 7;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceMonday);
  }
}
