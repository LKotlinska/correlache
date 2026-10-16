import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-outlined-field',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIcon, MatIconButton],
  styleUrl: './outlined-field.scss',
  templateUrl: './outlined-field.html',
})
export class OutlinedField {

  label = input.required<string>();
  placeholder = input<string>('');
  type = input<string>('text');
  myControl = input.required<FormControl>();
  hasPassView = input<boolean>(false)
  hide = signal(true);

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }
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