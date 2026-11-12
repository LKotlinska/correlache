import { Component, inject, signal } from '@angular/core';
import { Dialog } from '../dialog';
import { OutlinedField } from '../../form-fields/outlined-field/outlined-field';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../button/button';
import { DialogKey, DialogService } from '../dialog.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';

/** Optional dialog data; `notice` explains why sign-in was asked for. */
export interface LoginData {
  notice?: string;
}

@Component({
  imports: [Dialog, OutlinedField, ReactiveFormsModule, Button],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private dialogService = inject(DialogService);
  private dialogRef = inject(MatDialogRef<Login>);
  private userService = inject(UserService);
  private router = inject(Router);
  protected notice = inject<LoginData | null>(MAT_DIALOG_DATA, { optional: true })?.notice;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  signInForm = new FormGroup({
    emailFormControl: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    passwordFormConrol: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]),
  })

  switchDialog(key: DialogKey) {
    this.dialogService.switch(this.dialogRef, key)
  }

  onSubmit(){
    if (this.signInForm.invalid) {
      // Shows error when an invalid form is submitted
      this.signInForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const { emailFormControl, passwordFormConrol } = this.signInForm.value
    this.userService.authUser({
      email: emailFormControl!,
      password: passwordFormConrol!,
    }).subscribe({
      next: () => {
        this.dialogRef.close();
        this.router.navigate(['/user/diary']);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.status === 401
            ? 'Wrong email or password.'
            : 'Something went wrong. Please try again.',
        );
      }
    })
  }
}
