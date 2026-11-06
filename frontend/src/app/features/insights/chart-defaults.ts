import { ChartOptions } from 'chart.js';

/** Main bar colour shared by every insights chart. */
export const CHART_COLOR = '#6d74d1';
/** Contrasting colour for a second series shown alongside CHART_COLOR. */
export const CHART_COLOR_SECONDARY = '#e07a5f';

/** Pixel height of one horizontal bar's row, so a chart grows with its bars instead of stretching a few. */
const BAR_ROW_HEIGHT = 36;
/** Room below the bars for the value axis and its tick labels. */
const AXIS_SPACE = 40;

/** Height in pixels for a horizontal bar chart with this many bars. */
export function barChartHeight(bars: number, rowHeight = BAR_ROW_HEIGHT): number {
  return bars * rowHeight + AXIS_SPACE;
}

/** Options every chart starts from: fills its container, no legend. Charts add their own axes. */
export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
} satisfies ChartOptions;
