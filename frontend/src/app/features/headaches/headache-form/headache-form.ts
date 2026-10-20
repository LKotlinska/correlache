import { Component, inject, signal } from '@angular/core';
import { FormGroup, ɵInternalFormsSharedModule, ReactiveFormsModule, FormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { HeadacheService } from '../../../services/headache.service';
import { AsyncPipe } from '@angular/common';
import { MediaTile } from '../../../components/form-fields/media-tile/media-tile';
import { ChipList } from '../../../components/chip-list/chip-list';
import { Button } from '../../../components/button/button';
import { combineDateTime } from '../../../utils/combine-date-time';
import { CreateHeadachePayload } from '../../../models/headache.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

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
    MatSliderModule,
    AsyncPipe,
    MediaTile,
    ChipList,
    Button
],
  selector: 'app-headache-form',
  styleUrl: './headache-form.scss',
  templateUrl: './headache-form.html',
})
export class HeadacheForm {
  private headacheService = inject(HeadacheService);
  private snackBar = inject(MatSnackBar); // temporary snackbar
  options = this.headacheService.getOptions();
  isSubmitting = signal(false);

  headacheForm = new FormGroup({
    startDate: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    startTime: new FormControl<Date | null>(new Date()),
    endDate: new FormControl<Date | null>(null),
    endTime: new FormControl<Date | null>(null),
    painLevel: new FormControl<number>(1, { nonNullable: true }),
    locationIds: new FormControl<number[]>([], { nonNullable: true }),
    triggerIds: new FormControl<number[]>([], { nonNullable: true }),
    symptomIds: new FormControl<number[]>([], { nonNullable: true }),
    reliefIds: new FormControl<number[]>([], { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true })
  })

  isSelected(id: number) {
    return this.headacheForm.controls.locationIds.value.includes(id);
  }

  toggleLocation(id: number, checked: boolean) {
    const control = this.headacheForm.controls.locationIds;
    const currentIds = control.value;

    if (checked) {
      // Add ids when selected
      control.setValue([...currentIds, id]);
    } else {
      // Remove this id when unselected
      control.setValue(currentIds.filter(x => x !== id));
    }
  }

  /** Earliest selectable end time: the start time, but only when both fall on the same day. */
  get endTimeMin(): Date | null {
    const { startDate, startTime, endDate } = this.headacheForm.controls;
    if (startDate.value && endDate.value && startTime.value && this.isSameDay(startDate.value, endDate.value)) {
      return startTime.value;
    }
    return null;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  endDateFilter = (d: Date | null): boolean => {
    // Prevent end date from traveling back in time.
    const start = this.headacheForm.controls.startDate.value;
    if (d === null) {
      return false;
    }
    if (!start) {
      return true;
    }
    // Compare by calendar day so the same day stays selectable.
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return day >= startDay;
  };

  onSubmit() {
    if (this.isSubmitting()) {
      return;
    }
    if (this.headacheForm.invalid) { 
      this.headacheForm.markAllAsTouched(); 
      return; 
    }
    const { startDate, startTime, endDate, endTime, ...fields} = this.headacheForm.getRawValue();

    const payload: CreateHeadachePayload = {
      ...fields,
      startedAt: combineDateTime(startDate!, startTime),
      endedAt: endDate ? combineDateTime(endDate, endTime) : undefined,
    };

    this.isSubmitting.set(true);
    this.headacheService.create(payload).subscribe({
      next: () => {
        // Temporary snackbar - should redirect to headache view
        this.snackBar.open('Headache has been added', 'Close', { panelClass: 'snackbar-success',});
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        // Temporary error - should show in component
        this.snackBar.open(err.error?.message?.[0] ?? 'Something went wrong', 'Close', { panelClass: 'snackbar-error' });
      }
    });
  }
}
