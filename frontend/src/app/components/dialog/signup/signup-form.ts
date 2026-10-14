import {Component, inject, signal} from '@angular/core';
import {FormControl, Validators, ReactiveFormsModule, FormGroup} from '@angular/forms';
import { OutlinedField } from '../../form-fields/outlined-field/outlined-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Dialog } from '../dialog';
import { Button } from '../../button/button';
import { UserService } from '../../../services/user-service';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogKey, DialogService } from '../dialog.service';


@Component({
  selector: 'app-signup-form',
  styleUrl: './signup-form.scss',
  templateUrl: './signup-form.html',
  imports: [
    ReactiveFormsModule,
    OutlinedField,
    MatCheckboxModule,
    Dialog,
    Button,
],
})
export class SignupForm {
  private userService = inject(UserService);
  private dialogService = inject(DialogService);
  private dialogRef = inject(MatDialogRef<SignupForm>);
  private snackBar = inject(MatSnackBar);

  isSubmitting = signal(false);

  addUserForm = new FormGroup({
    nameFormControl: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    emailFormControl: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    passwordFormControl: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]),
    termsFormControl: new FormControl(false, [Validators.requiredTrue]),
  });

  get termsInvalid() {
    const terms = this.addUserForm.controls.termsFormControl;
    return terms.invalid && terms.touched;
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
    }).subscribe({
      next: () => {
        this.dialogRef.close();
        this.snackBar.open('Registered successfully', 'Close', { panelClass: 'snackbar-success',});
      },
      error: (err) => {
        this.isSubmitting.set(false);

        if (err.status === 409 && err.error?.code === 'EMAIL_TAKEN') {
          this.addUserForm.controls.emailFormControl.setErrors({ emailTaken: true });
          return; // no snackbar
        }
        const msg = err.error?.message;
        const text = Array.isArray(msg)
          ? msg.join('. ')
          : (msg ?? 'Something went wrong. Please try again.');
        this.snackBar.open(text, 'Close', { panelClass: 'snackbar-error' });
      },
    });
  }
}
