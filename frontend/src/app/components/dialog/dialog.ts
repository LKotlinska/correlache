import { Component, input } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogHeader } from './dialog-header/dialog-header';

@Component({
  imports: [MatDialogModule, DialogHeader],
  selector: 'app-dialog',
  styleUrl: './dialog.scss',
  templateUrl: './dialog.html',
})
export class Dialog {
  heading = input.required<string>();
}
