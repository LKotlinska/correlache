import {Component, inject} from '@angular/core';
import {FormControl, Validators, ReactiveFormsModule, FormGroup} from '@angular/forms';
import { OutlinedField } from '../../form-fields/outlined-field/outlined-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Dialog } from '../dialog';
import { Button } from '../../button/button/button';
import { UserService } from '../../../services/user-service';


@Component({
  selector: 'app-signup-form',
  styleUrl: './signup-form.scss',
  templateUrl: './signup-form.html',
  imports: [
    ReactiveFormsModule, 
    OutlinedField, 
    MatCheckboxModule, 
    Dialog, 
    Button
  ],
})
export class SignupDialog {
  private userService = inject(UserService);

  addUserForm = new FormGroup({
    nameFormControl: new FormControl('', [Validators.required, Validators.maxLength(25),]),
    emailFormControl: new FormControl('', [Validators.required, Validators.email]),
    passwordFormControl: new FormControl('', [Validators.required, Validators.minLength(8)]),
    termsFormControl: new FormControl(false, [Validators.requiredTrue]),
  });

  onSubmit(){
    if (this.addUserForm.invalid) {
      return
    }
    const { nameFormControl, emailFormControl, passwordFormControl } = this.addUserForm.value;
    this.userService.createUser({
      name: nameFormControl!,
      email: emailFormControl!,
      password: passwordFormControl!,
    })
  }
}
