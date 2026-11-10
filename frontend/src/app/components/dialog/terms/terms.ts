import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Dialog } from '../dialog';
import { MatButton } from '@angular/material/button';
import { DialogKey, DialogService } from '../dialog.service';

@Component({
  imports: [MatDialogModule, Dialog, MatButton],
  selector: 'app-terms',
  styleUrl: './terms.scss',
  templateUrl: './terms.html',
})
export class Terms {
  private dialogService = inject(DialogService);
  private dialogRef = inject(MatDialogRef<Terms>);

  // Opened from settings (signed in): just close instead of returning to registration
  private data = inject<{ standalone?: boolean } | null>(MAT_DIALOG_DATA, { optional: true });

  acknowledge() {
    if (this.data?.standalone) this.dialogRef.close();
    else this.switchDialog('register');
  }

  switchDialog(key: DialogKey) {
    this.dialogService.switch(this.dialogRef, key);
  }
}
