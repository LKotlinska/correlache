import { Component, input } from '@angular/core';
import { DialogHeader } from './dialog-header/dialog-header';

@Component({
  imports: [DialogHeader],
  selector: 'app-dialog',
  styleUrl: './dialog.scss',
  templateUrl: './dialog.html',
})
export class Dialog {
  heading = input.required<string>();
}
