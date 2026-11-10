import { Component, computed, inject, TemplateRef } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Dialog } from '../../../../components/dialog/dialog';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY, barChartHeight } from '../../chart-defaults';
import { InsightsData } from '../../insights-data';
import { Period } from '../../period';
import { matchPattern, PATTERN_NAMES } from '../../../../utils/headache-patterns';

const DEFAULT_PERIOD: Period = { unit: 'month', count: 3 };
const MIXED = 'A mix of patterns';
const UNCLEAR = 'No clear pattern';

@Component({
  imports: [BaseChartDirective, Dialog, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatIcon, MatIconButton, MatProgressBar],
  selector: 'app-headache-patterns',
  styleUrl: './headache-patterns.scss',
  templateUrl: './headache-patterns.html',
})
export class HeadachePatterns {
  private data = inject(InsightsData);
  private dialog = inject(MatDialog);

  /** Headaches shared by the insights charts. */
  headaches = this.data.headaches;

  /** The picked range, or the last 3 months. */
  private shown = this.data.chartPeriod(DEFAULT_PERIOD);
  periodLabel = this.shown.label;

  /** Headaches from the first shown day until now. */
  list = this.data.since('headaches', this.shown.start);

  /**
   * Headaches per pattern they resemble, most first, then mixes and unclear ones. Headaches with too little
   * detail or with symptoms that can need a doctor are counted separately.
   */
  counts = computed(() => {
    const byPattern = new Map<string, number>();
    let tooLittle = 0;
    let warnings = 0;

    for (const h of this.list()) {
      const match = matchPattern(h);
      if (match.kind === 'too-little') tooLittle++;
      else if (match.kind === 'warning') warnings++;
      else {
        const name =
          match.kind === 'unclear' ? UNCLEAR : match.patterns.length > 1 ? MIXED : PATTERN_NAMES[match.patterns[0].key];
        byPattern.set(name, (byPattern.get(name) ?? 0) + 1);
      }
    }

    const last = (name: string) => Number(name === MIXED || name === UNCLEAR);
    const patterns = [...byPattern]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => last(a.name) - last(b.name) || b.count - a.count || a.name.localeCompare(b.name));
    return { patterns, tooLittle, warnings };
  });

  /** The pattern most headaches resemble, when there is one. */
  summary = computed(() => {
    const top = this.counts().patterns[0];
    if (!top || top.name === MIXED || top.name === UNCLEAR) return null;
    return { name: top.name.toLowerCase(), count: top.count, total: this.list().length };
  });

  chartHeight = computed(() => barChartHeight(this.counts().patterns.length));

  /** Chart.js data - one bar per pattern, mixes and unclear ones in the secondary colour. */
  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const patterns = this.counts().patterns;
    return {
      labels: patterns.map(p => p.name),
      datasets: [{
        data: patterns.map(p => p.count),
        backgroundColor: patterns.map(p => (p.name === MIXED || p.name === UNCLEAR ? CHART_COLOR_SECONDARY : CHART_COLOR)),
        borderRadius: 4,
      }],
    };
  });

  /** Horizontal bars (patterns on y) that fill the container. */
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    ...baseChartOptions,
    indexAxis: 'y',
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
      y: { grid: { display: false } },
    },
  };

  /** Opens the explanation of the chart. */
  openInfo(info: TemplateRef<unknown>): void {
    this.dialog.open(info);
  }
}
