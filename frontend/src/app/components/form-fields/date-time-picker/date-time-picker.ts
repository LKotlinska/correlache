import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';

/** A date field and a time field side by side, bound to two separate controls. */
@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule,
  ],
  selector: 'app-date-time-picker',
  styleUrl: './date-time-picker.scss',
  templateUrl: './date-time-picker.html',
})
export class DateTimePicker {
  dateControl = input.required<FormControl<Date | null>>();
  timeControl = input.required<FormControl<Date | null>>();

  /** Latest selectable date. */
  maxDate = input<Date | null>(null);
  /** Optional predicate to disable individual dates. */
  dateFilter = input<(d: Date | null) => boolean>(() => true);
  timeMin = input<Date | null>(null);
  timeMax = input<Date | null>(null);
}
