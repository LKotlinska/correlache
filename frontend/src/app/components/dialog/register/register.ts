import {Component, inject, signal} from '@angular/core';
import {FormControl, Validators, ReactiveFormsModule, FormGroup} from '@angular/forms';
import { OutlinedField } from '../../form-fields/outlined-field/outlined-field';
import { HealthConsentCheckbox } from '../../form-fields/health-consent-checkbox/health-consent-checkbox';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Dialog } from '../dialog';
import { Button } from '../../button/button';
import { UserService } from '../../../services/user.service';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogKey, DialogService } from '../dialog.service';
import { HttpErrorResponse } from '@angular/common/http';
import { getErrorMessage } from '../../../utils/error-message';


@Component({
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
  imports: [
    ReactiveFormsModule,
    OutlinedField,
    HealthConsentCheckbox,
    MatCheckboxModule,
    Dialog,
    Button,
],
})
export class Register {
  private userService = inject(UserService);
  private dialogService = inject(DialogService);
  private dialogRef = inject(MatDialogRef<Register>);
  private snackBar = inject(MatSnackBar);

  isSubmitting = signal(false);

  addUserForm = new FormGroup({
    nameFormControl: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    emailFormControl: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    passwordFormControl: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]),
    termsFormControl: new FormControl(false, [Validators.requiredTrue]),
    // Kept apart from the terms: art. 9 consent must be specific and not bundled with other agreements
    healthConsentFormControl: new FormControl(false, [Validators.requiredTrue]),
  });

  get termsInvalid() {
    const terms = this.addUserForm.controls.termsFormControl;
    return terms.invalid && terms.touched;
  }

  /** Opens Terms or Privacy on top, so the form keeps what was filled in. */
  openOnTop(event: Event, key: 'terms' | 'privacy') {
    // Stops the click from also toggling the checkbox the link sits in
    event.preventDefault();
    this.dialogService.open(key);
  }

  switchDialog(key: DialogKey){
    this.dialogService.switch(this.dialogRef, key)
  }

  onSubmit(){
    if (this.isSubmitting()) {
      return;
    }
    if (this.addUserForm.invalid) {
      // Shows error when an invalid form is submitted
      this.addUserForm.markAllAsTouched();
      return;
    }
    const { nameFormControl, emailFormControl, passwordFormControl } = this.addUserForm.value;
    this.isSubmitting.set(true);
    this.userService.createUser({
      name: nameFormControl!,
      email: emailFormControl!,
      password: passwordFormControl!,
      healthDataConsent: true, // the form can't be submitted without it
    }).subscribe({
      next: () => {
        this.dialogRef.close();
        this.snackBar.open('Registered successfully', 'Close', { panelClass: 'snackbar-success',});
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);

        if (err.status === 409 && err.error?.code === 'EMAIL_TAKEN') {
          this.addUserForm.controls.emailFormControl.setErrors({ emailTaken: true });
          return; // no snackbar
        }
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      },
    });
  }
}
