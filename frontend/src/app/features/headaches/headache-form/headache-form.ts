import { Component } from '@angular/core';
import { FormGroup, ɵInternalFormsSharedModule, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTimepickerModule } from '@angular/material/timepicker';

@Component({
  imports: [
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule,
    MatSliderModule
],
  selector: 'app-headache-form',
  styleUrl: './headache-form.scss',
  templateUrl: './headache-form.html',
})
export class HeadacheForm {
  headacheForm = new FormGroup({
    startDate: new FormControl(),
    startTime: new FormControl(),
    endDate: new FormControl(),
    endTime: new FormControl(),
    painLevel: new FormControl(),
  })

  endDateFilter = (d: Date | null): boolean => {
    const day = new Date();
    // Prevent end date from traveling back in time.
    return d !== null && d >= this.headacheForm.controls.startDate.value;
  };
}
