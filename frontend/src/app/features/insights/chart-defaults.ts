import { ChartConfiguration } from 'chart.js';

/** Main bar colour shared by every insights chart. */
export const CHART_COLOR = '#926dd1';

/** Options every bar chart starts from: fills its container, no legend. Charts add their own axes. */
export const baseBarOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

/** Same starting point as baseBarOptions, for line charts. */
export const baseLineOptions: ChartConfiguration<'line'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

/** Same starting point as baseBarOptions, for radar charts. */
export const baseRadarOptions: ChartConfiguration<'radar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};
