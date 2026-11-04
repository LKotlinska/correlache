import { Component } from '@angular/core';
import { HeadachesPerMonth } from './charts/headaches-per-month/headaches-per-month';
import { TopTriggers } from './charts/top-triggers/top-triggers';
import { PainOverTime } from './charts/pain-over-time/pain-over-time';
import { HeadachesByWeekday } from './charts/headaches-by-weekday/headaches-by-weekday';
import { WorkoutsPerWeek } from './charts/workouts-per-week/workouts-per-week';

@Component({
  imports: [HeadachesPerMonth, TopTriggers, PainOverTime, HeadachesByWeekday, WorkoutsPerWeek],
  selector: 'app-insights',
  styleUrl: './insights.scss',
  templateUrl: './insights.html',
})
export class Insights {}
