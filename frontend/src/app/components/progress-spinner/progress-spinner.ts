import { Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  imports: [MatProgressSpinner],
  selector: 'app-progress-spinner',
  styleUrl: './progress-spinner.scss',
  templateUrl: './progress-spinner.html',
})
export class ProgressSpinner {
  ariaLabel = input.required<string>();
  diameter = input(48);
}
