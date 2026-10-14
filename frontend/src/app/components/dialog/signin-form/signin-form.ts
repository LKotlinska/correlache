import { Component, inject, signal } from '@angular/core';
import { Dialog } from '../dialog';
import { OutlinedField } from '../../form-fields/outlined-field/outlined-field';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../button/button';
import { DialogKey, DialogService } from '../dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { email } from '@angular/forms/signals';

@Component({
  imports: [Dialog, OutlinedField, ReactiveFormsModule, Button],
  selector: 'app-signin-form',
  styleUrl: './signin-form.scss',
  templateUrl: './signin-form.html',
})
export class SigninForm {
  private dialogService = inject(DialogService);
  private dialogRef = inject(MatDialogRef<SigninForm>);
  private userService = inject(UserService);
  private router = inject(Router);
  isSubmitting = signal(false);

  signInForm = new FormGroup({
    emailFormControl: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    passwordFormConrol: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]),
  })

  switchDialog(key: DialogKey) {
    this.dialogService.switch(this.dialogRef, key)
  }

  onSubmit(){
    this.isSubmitting.set(true);
    if (this.signInForm.invalid) {
      // Shows error when an invalid form is submitted
      this.signInForm.markAllAsTouched();
      return;
    }
    const { emailFormControl, passwordFormConrol } = this.signInForm.value
    this.userService.authUser({
      email: emailFormControl!,
      password: passwordFormConrol!,
    }).subscribe({
      next: () => {
        this.dialogRef.close();
        this.dialogRef.afterClosed().subscribe(() => this.router.navigate(['/dashboard']))
      },
      error: () => {
        this.isSubmitting.set(false)
      }
    })
  }
}
