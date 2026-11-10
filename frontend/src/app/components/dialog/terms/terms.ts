import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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

  /** Always opened on top of whatever opened it (signup, settings, consent), so closing returns there. */
  acknowledge() {
    this.dialogRef.close();
  }

  switchDialog(key: DialogKey) {
    this.dialogService.switch(this.dialogRef, key);
  }
}
