import { Component } from '@angular/core';
import { PageHeader } from '../../../components/page-header/page-header';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { Button } from '../../../components/button/button';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OutlinedField } from '../../../components/form-fields/outlined-field/outlined-field';
import { DateTimePicker } from '../../../components/form-fields/date-time-picker/date-time-picker';
import { validate } from '@angular/forms/signals';

@Component({
  imports: [ReactiveFormsModule, MatStepperModule, MatButtonModule, PageHeader, Button, DateTimePicker, OutlinedField],
  selector: 'app-workout-form',
  styleUrl: './workout-form.scss',
  templateUrl: './workout-form.html',
})
export class WorkoutForm {
  today = new Date();
  
  workoutForm = new FormGroup({
    startDate: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    startTime: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    durationHours: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(23)] }),
    durationMinutes: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(59)] }),
    title: new FormControl<string>('', { validators: [Validators.required]}),
  })
}
