import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

/** Highlighted note above a group of insight charts, e.g. "correlation, not causation". */
@Component({
  imports: [MatIcon],
  selector: 'app-disclaimer',
  styleUrl: './disclaimer.scss',
  templateUrl: './disclaimer.html',
})
export class Disclaimer {}
