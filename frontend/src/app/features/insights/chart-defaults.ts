import { Chart, ChartOptions } from 'chart.js';

/** Main bar colour shared by every insights chart. */
export const CHART_COLOR = '#6d58a8';
/** Contrasting colour for a second series shown alongside CHART_COLOR. */
export const CHART_COLOR_SECONDARY = '#c95e40';

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

/** Axis text and grid line colours per colour scheme; match $text-strong in _variables.scss. */
const CHART_THEME = {
  light: { text: '#49454f', grid: 'rgba(0, 0, 0, 0.1)' },
  dark: { text: '#cac4d0', grid: 'rgba(255, 255, 255, 0.12)' },
};

/**
 * Canvas charts can't read CSS light-dark(), so point Chart.js's global text and grid colours
 * at the OS colour scheme and redraw open charts when it changes.
 */
export function followColorScheme(): void {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    const theme = query.matches ? CHART_THEME.dark : CHART_THEME.light;
    Chart.defaults.color = theme.text;
    Chart.defaults.borderColor = theme.grid;
    Object.values(Chart.instances).forEach(chart => chart.update());
  };
  apply();
  query.addEventListener('change', apply);
}
