import { Component, computed, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatProgressBar } from '@angular/material/progress-bar';
import { baseChartOptions, CHART_COLOR_SECONDARY } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { joinNames } from '../../../../utils/join-names';
import { Period, periodMonths } from '../../period';

const DEFAULT_PERIOD: Period = { unit: 'month', count: 3 };

@Component({
  imports: [BaseChartDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar],
  selector: 'app-headaches-per-month',
  styleUrl: './headaches-per-month.scss',
  templateUrl: './headaches-per-month.html',
})
export class HeadachesPerMonth {
  /** English month names: short for chart labels, long for the summary text. */
  private monthShortFmt = new Intl.DateTimeFormat('en-GB', { month: 'short' });
  private monthLongFmt = new Intl.DateTimeFormat('en-GB', { month: 'long' });

  private data = inject(InsightsData);

  /** Headaches shared by the insights charts. */
  headaches = this.data.headaches;

  /** The picked range, or the last 3 months, from the first day of its oldest month so every bar is a whole month. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD, 'month');
  periodLabel = this.shown.label;

  /** Headaches from the first day of the oldest shown month until now. */
  list = this.data.since('headaches', this.shown.start);

  /** Oldest to newest, including months without any headaches. */
  monthlyCounts = computed(() => {
    // One zeroed list per month, so months without headaches still appear.
    const months = periodMonths(this.shown.period()).map(date => ({ date, count: 0 }));

    // Count each headache in the list matching its year and month.
    for (const h of this.list()) {
      const d = new Date(h.startedAt);
      const month = months.find(m => m.date.getFullYear() === d.getFullYear() && m.date.getMonth() === d.getMonth());
      if (month) month.count++;
    }
    return months;
  });

  /** Year of the months shown, e.g. "2026", or "2025 – 2026" when they span two years. */
  year = computed(() => {
    const months = this.monthlyCounts();
    const first = months[0].date.getFullYear();
    const last = months[months.length - 1].date.getFullYear();
    return first === last ? `${last}` : `${first} – ${last}`;
  });

  /** Month(s) with the most and the least headaches, or null when every month is equal. */
  summary = computed(() => {
    const months = this.monthlyCounts();
    const counts = months.map(m => m.count);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    if (max === min) return null;

    const namesWith = (count: number) => joinNames(months.filter(m => m.count === count).map(m => this.monthLongFmt.format(m.date)));
    return { most: namesWith(max), least: namesWith(min) };
  });

  /** Chart.js data - one bar per month, labelled with its capitalised short name. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const months = this.monthlyCounts();
    return {
      labels: months.map(m => this.capitalize(this.monthShortFmt.format(m.date))),
      datasets: [{
        data: months.map(m => m.count),
        backgroundColor: CHART_COLOR_SECONDARY,
        borderRadius: 4,
      }],
    };
  });

  /** Horizontal bars (months on y) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    indexAxis: 'y',
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
      y: { grid: { display: false } },
    },
  };

  private capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
