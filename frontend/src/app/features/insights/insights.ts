import { Component } from '@angular/core';
import { HeadachesPerMonth } from './charts/headaches-per-month/headaches-per-month';
import { TopTriggers } from './charts/top-triggers/top-triggers';
import { PainOverTime } from './charts/pain-over-time/pain-over-time';

@Component({
  imports: [HeadachesPerMonth, TopTriggers, PainOverTime],
  selector: 'app-insights',
  styleUrl: './insights.scss',
  templateUrl: './insights.html',
})
export class Insights {}
