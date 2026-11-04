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
  selector: 'app-headaches-per-month',
  styleUrl: './headaches-per-month.scss',
  templateUrl: './headaches-per-month.html',
})
export class HeadachesPerMonth {
  private headacheService = inject(HeadacheService);

  /** English month names: short for chart labels, long for the summary text. */
  private monthShortFmt = new Intl.DateTimeFormat('en-GB', { month: 'short' });
  private monthLongFmt = new Intl.DateTimeFormat('en-GB', { month: 'long' });

  /** Headaches from the first day of the oldest shown month until now. */
  headaches = rxResource({
    stream: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1), 1);
      return this.headacheService.getHeadaches({ from });
    },
  })

  /** Oldest to newest, including months without any headaches. */
  monthlyCounts = computed(() => {
    const list = this.headaches.value() ?? [];
    const now = new Date();

    // One zeroed list per month, so months without headaches still appear.
    const months = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1 - i), 1);
      return { date, count: 0 };
    });

    // Count each headache in the list matching its year and month.
    for (const h of list) {
      const d = new Date(h.startedAt);
      const month = months.find(m => m.date.getFullYear() === d.getFullYear() && m.date.getMonth() === d.getMonth());
      if (month) month.count++;
    }
    return months;
  });

  /** Year of the newest month shown. */
  year = computed(() => this.monthlyCounts()[MONTHS_SHOWN - 1].date.getFullYear());

  /** Most and least month. allEqual lets the template skip the comparison when there is no difference. */
  summary = computed(() => {
    const months = this.monthlyCounts();
    const most = months.reduce((a, b) => (b.count > a.count ? b : a));
    const least = months.reduce((a, b) => (b.count < a.count ? b : a));
    return {
      most: this.monthLongFmt.format(most.date),
      least: this.monthLongFmt.format(least.date),
      allEqual: most.count === least.count,
    };
  });

  /** Chart.js data - one bar per month, labelled with its capitalised short name. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const months = this.monthlyCounts();
    return {
      labels: months.map(m => this.capitalize(this.monthShortFmt.format(m.date))),
      datasets: [{
        data: months.map(m => m.count),
        backgroundColor: CHART_COLOR,
        borderRadius: 4,
      }],
    };
  });

  /** Horizontal bars (months on y) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseBarOptions,
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
