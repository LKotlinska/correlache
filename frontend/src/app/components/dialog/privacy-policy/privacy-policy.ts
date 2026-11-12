import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Dialog } from '../dialog';
import { MatAnchor, MatButton } from '@angular/material/button';

@Component({
  imports: [MatDialogModule, Dialog, MatAnchor, MatButton],
  selector: 'app-privacy-policy',
  styleUrl: './privacy-policy.scss',
  templateUrl: './privacy-policy.html',
})
export class PrivacyPolicy {
  private dialogRef = inject(MatDialogRef<PrivacyPolicy>);
  
  /** Always opened on top of whatever opened it (signup, settings, consent), so closing returns there. */
  acknowledge() {
    this.dialogRef.close();
  }
}
