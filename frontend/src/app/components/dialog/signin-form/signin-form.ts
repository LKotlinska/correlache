import { Component, inject } from '@angular/core';
import { Dialog } from '../dialog';
import { OutlinedField } from '../../form-fields/outlined-field/outlined-field';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../button/button';
import { DialogKey, DialogService } from '../dialog.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  imports: [Dialog, OutlinedField, ReactiveFormsModule, Button],
  selector: 'app-signin-form',
  styleUrl: './signin-form.scss',
  templateUrl: './signin-form.html',
})
export class SigninForm {
  private dialogService = inject(DialogService);
  private dialogRef = inject(MatDialogRef<SigninForm>)

  signInForm = new FormGroup({
    emailFormControl: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    passwordFormConrol: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]),
  })

  switchDialog(key: DialogKey) {
    this.dialogService.switch(this.dialogRef, key)
  }
}
