import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Dialog } from '../dialog';
import { Button } from '../../button/button';
import { HealthConsentCheckbox } from '../../form-fields/health-consent-checkbox/health-consent-checkbox';
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
  imports: [Dialog, Button, HealthConsentCheckbox],
})
export class Consent {
  private userService = inject(UserService);
  private accountActions = inject(AccountActions);
  private router = inject(Router);
  private dialogRef = inject<MatDialogRef<Consent, ConsentResult>>(MatDialogRef);
  private snackBar = inject(MatSnackBar);

  consentControl = new FormControl<boolean | null>(false, [Validators.requiredTrue]);
  isSubmitting = signal(false);

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
    this.accountActions.signOut().subscribe(() => this.leave());
  }

  deleteAccount() {
    this.accountActions.confirmDeleteAccount().subscribe(() => this.leave());
  }

  /** Goes home itself: the navigation that opened this dialog may have been replaced since (e.g. by Back). */
  private leave() {
    this.dialogRef.close('left');
    this.router.navigate(['/']);
  }
}
