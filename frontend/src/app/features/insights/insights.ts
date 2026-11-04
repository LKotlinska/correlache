import { Component } from '@angular/core';
import { HeadachesPerMonth } from './charts/headaches-per-month/headaches-per-month';

@Component({
  imports: [HeadachesPerMonth],
  selector: 'app-insights',
  styleUrl: './insights.scss',
  templateUrl: './insights.html',
})
export class Insights {}
