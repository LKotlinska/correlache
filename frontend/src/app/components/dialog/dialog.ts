import { booleanAttribute, Component, input } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogHeader } from './dialog-header/dialog-header';

@Component({
  imports: [MatDialogModule, DialogHeader],
  host: { '[class.compact-heading]': 'compactHeading()' },
  selector: 'app-dialog',
  styleUrl: './dialog.scss',
  templateUrl: './dialog.html',
})
export class Dialog {
  heading = input.required<string>();
  /** False hides the close button, for dialogs that need an explicit choice. */
  closable = input(true);
  /** Smaller heading, for long names. */
  compactHeading = input(false, { transform: booleanAttribute });
}
