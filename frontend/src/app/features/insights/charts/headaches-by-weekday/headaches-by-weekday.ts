import { Component, computed, inject } from '@angular/core';
import { HeadacheService } from '../../../../services/headache.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseBarOptions, CHART_COLOR } from '../../chart-defaults';

const MONTHS_SHOWN = 3;

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-headaches-by-weekday',
  styleUrl: './headaches-by-weekday.scss',
  templateUrl: './headaches-by-weekday.html',
})
export class HeadachesByWeekday {
  private headacheService = inject(HeadacheService);

  /** English weekday names: short for chart labels, long for the summary text. */
  private dayShortFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
  private dayLongFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });

  /** Headaches from the first day of the oldest shown month until now. */
  headaches = rxResource({
    stream: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1), 1);
      return this.headacheService.getHeadaches({ from });
    },
  })

  /** Monday to Sunday, including days without any headaches. */
  weekdayCounts = computed(() => {
    const list = this.headaches.value() ?? [];

    // Any known Monday works as a reference: 1 Jan 2024 was one.
    const days = Array.from({ length: 7 }, (_, i) => ({ date: new Date(2024, 0, 1 + i), count: 0 }));

    // getDay() counts from Sunday, so shift it to count from Monday.
    for (const h of list) {
      days[(new Date(h.startedAt).getDay() + 6) % 7].count++;
    }
    return days;
  });

  /** Weekday(s) with the most headaches, or null when there are none or every day is equal. */
  summary = computed(() => {
    const days = this.weekdayCounts();
    const max = Math.max(...days.map(d => d.count));
    const min = Math.min(...days.map(d => d.count));
    if (max === 0 || max === min) return null;

    const names = days.filter(d => d.count === max).map(d => this.dayLongFmt.format(d.date) + 's');
    return { days: this.joinNames(names), count: max };
  });

  /** Chart.js data - one bar per weekday, Monday first. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const days = this.weekdayCounts();
    return {
      labels: days.map(d => this.dayShortFmt.format(d.date)),
      datasets: [{
        data: days.map(d => d.count),
        backgroundColor: CHART_COLOR,
        borderRadius: 4,
      }],
    };
  });

  /** Vertical bars (weekdays on x) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseBarOptions,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
    },
  };

  /** "A", "A and B", "A, B and C". */
  private joinNames(names: string[]) {
    return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  }
}
