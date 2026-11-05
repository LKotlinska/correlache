import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { monthStart } from '../../../../utils/date';
import { joinNames } from '../../../../utils/join-names';

const MONTHS_SHOWN = 3;

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-headaches-by-weekday',
  styleUrl: './headaches-by-weekday.scss',
  templateUrl: './headaches-by-weekday.html',
})
export class HeadachesByWeekday {
  /** English weekday names: short for chart labels, long for the summary text. */
  private dayShortFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
  private dayLongFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });

  /** Headaches shared by the insights charts. */
  headaches = inject(InsightsData).headaches;

  /** Headaches from the first day of the oldest shown month until now. */
  list = computed(() => {
    const from = monthStart(MONTHS_SHOWN - 1);
    return (this.headaches.value() ?? []).filter(h => new Date(h.startedAt) >= from);
  });

  /** Monday to Sunday, including days without any headaches. */
  weekdayCounts = computed(() => {
    // Any known Monday works as a reference: 1 Jan 2024 was one.
    const days = Array.from({ length: 7 }, (_, i) => ({ date: new Date(2024, 0, 1 + i), count: 0 }));

    // getDay() counts from Sunday, so shift it to count from Monday.
    for (const h of this.list()) {
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
    return { days: joinNames(names), count: max };
  });

  /** Chart.js data - one bar per weekday, Monday first. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const days = this.weekdayCounts();
    return {
      labels: days.map(d => this.dayShortFmt.format(d.date)),
      datasets: [{
        data: days.map(d => d.count),
        backgroundColor: CHART_COLOR_SECONDARY,
        borderRadius: 4,
      }],
    };
  });

  /** Vertical bars (weekdays on x) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
    },
  };
}
