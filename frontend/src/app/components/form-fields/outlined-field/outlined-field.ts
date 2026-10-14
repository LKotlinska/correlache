import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-outlined-field',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  styleUrl: './outlined-field.scss',
  templateUrl: './outlined-field.html',
})
export class OutlinedField {

  label = input.required<string>();
  placeholder = input<string>('');
  type = input<string>('text');
  myControl = input.required<FormControl>();

  private messages: Record<string, string> = {
    required: 'This field is required',
    email: 'Please enter a valid email adress',
    minlength: 'Value is too short',
    emailTaken: 'This email is already registered',
  };

  getErrorMessage(): string | null {
    const errors = this.myControl().errors;
    if (!errors) return null;
    const key = Object.keys(errors)[0];
    return this.messages[key] ?? 'Invalid value';
  }
}