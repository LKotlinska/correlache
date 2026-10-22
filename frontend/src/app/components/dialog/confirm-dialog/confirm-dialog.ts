import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Dialog } from '../dialog';

export interface ConfirmDialogData {
  heading: string;
  message: string;
  confirmLabel: string;
}

/** Asks the user to confirm an action. Closes with `true` when confirmed. */
@Component({
  imports: [Dialog, MatDialogModule, MatButtonModule],
  selector: 'app-confirm-dialog',
  styleUrl: './confirm-dialog.scss',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
