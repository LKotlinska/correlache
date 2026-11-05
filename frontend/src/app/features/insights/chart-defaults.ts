import { ChartOptions } from 'chart.js';

/** Main bar colour shared by every insights chart. */
export const CHART_COLOR = '#6d74d1';
/** Contrasting colour for a second series shown alongside CHART_COLOR. */
export const CHART_COLOR_SECONDARY = '#e07a5f';

/** Options every chart starts from: fills its container, no legend. Charts add their own axes. */
export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
} satisfies ChartOptions;
