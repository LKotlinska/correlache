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

  endDateFilter = (d: Date | null): boolean => {
    const day = new Date();
    // Prevent end date from traveling back in time.
    return d !== null && d >= this.headacheForm.controls.startDate.value!;
  };

  onSubmit() {
    if (this.isSubmitting()) {
      return;
    }
  }
}
