import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Dialog } from '../dialog';
import { MatAnchor, MatButton } from '@angular/material/button';
import { DialogKey, DialogService } from '../dialog.service';

@Component({
  imports: [MatDialogModule, Dialog, MatAnchor, MatButton],
  selector: 'app-privacy-policy',
  styleUrl: './privacy-policy.scss',
  templateUrl: './privacy-policy.html',
})
export class PrivacyPolicy {
  private dialogService = inject(DialogService);
  private dialogRef = inject(MatDialogRef<PrivacyPolicy>);
  
  switchDialog(key: DialogKey){
    this.dialogService.switch(this.dialogRef, key)
  }
}
