import {Component} from '@angular/core';
import {FormControl, Validators, ReactiveFormsModule} from '@angular/forms';
import {MatDialogModule} from '@angular/material/dialog';
import { OutlinedField } from '../../form-fields/outlined-field/outlined-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Dialog } from '../dialog';
import { Button } from '../../button/button/button';


@Component({
  selector: 'app-signup-dialog',
  styleUrl: './signup-dialog.scss',
  templateUrl: './signup-dialog.html',
  imports: [
    MatDialogModule, 
    ReactiveFormsModule, 
    OutlinedField, 
    MatCheckboxModule, 
    Dialog, 
    Button
  ],
})
export class SignupDialog {
  nameFormControl = new FormControl('', [Validators.required, Validators.minLength(1)]);
  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required, Validators.minLength(8)]);
  termsFormControl = new FormControl(false, [Validators.requiredTrue]);
}
