import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Dialog } from '../dialog';
import { Button } from '../../button/button';
import { DialogService } from '../dialog.service';
import { UserService } from '../../../services/user.service';
import { AccountActions } from '../../../services/account-actions';
import { getErrorMessage } from '../../../utils/error-message';

/** `consented` when consent was recorded; `left` after signing out or deleting the account. */
export type ConsentResult = 'consented' | 'left';

/** Asks accounts created before signup recorded consent for explicit consent to processing health data. */
@Component({
  selector: 'app-consent',
  styleUrl: './consent.scss',
  templateUrl: './consent.html',
  imports: [ReactiveFormsModule, MatCheckboxModule, Dialog, Button],
})
export class Consent {
  private userService = inject(UserService);
  private accountActions = inject(AccountActions);
  private dialogService = inject(DialogService);
  private dialogRef = inject<MatDialogRef<Consent, ConsentResult>>(MatDialogRef);
  private snackBar = inject(MatSnackBar);

  consentControl = new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] });
  isSubmitting = signal(false);

  get consentInvalid() {
    return this.consentControl.invalid && this.consentControl.touched;
  }

  openPrivacyPolicy() {
    // Opens on top, so this dialog stays open behind it
    this.dialogService.open('privacy', { standalone: true });
  }

  giveConsent() {
    if (this.isSubmitting()) return;
    if (this.consentControl.invalid) {
      this.consentControl.markAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.userService.giveConsent().subscribe({
      next: () => this.dialogRef.close('consented'),
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      },
    });
  }

  signOut() {
    this.accountActions.signOut().subscribe(() => this.dialogRef.close('left'));
  }

  deleteAccount() {
    this.accountActions.confirmDeleteAccount().subscribe(() => this.dialogRef.close('left'));
  }
}
