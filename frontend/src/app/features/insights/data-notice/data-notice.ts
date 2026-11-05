import { Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Readiness } from '../readiness';

/** Tells the user a category has too little data to show reliable patterns, and lets them look anyway. */
@Component({
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatButton, MatProgressBar],
  selector: 'app-data-notice',
  styleUrl: './data-notice.scss',
  templateUrl: './data-notice.html',
})
export class DataNotice {
  title = input.required<string>();
  readiness = input.required<Readiness>();
  show = output<void>();

  /** What is still missing, as progress towards each requirement. */
  progress = computed(() => {
    const { headaches, workouts, weeks, threshold } = this.readiness();
    return [
      { label: 'headaches logged', value: headaches, needed: threshold.headaches },
      { label: 'workouts logged', value: workouts, needed: threshold.workouts },
      { label: 'weeks of history', value: weeks, needed: threshold.weeks },
    ]
      .filter(p => p.needed > 0)
      .map(p => ({ ...p, percent: Math.min(100, (p.value / p.needed) * 100) }));
  });
}
