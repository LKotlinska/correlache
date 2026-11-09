import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { Dialog } from '../../../components/dialog/dialog';
import { OutlinedField } from '../../../components/form-fields/outlined-field/outlined-field';
import { Medication, MedicationClass, MedicationUse } from '../../../models/medication.model';
import { MedicationService } from '../../../services/medication.service';
import { getErrorMessage } from '../../../utils/error-message';
import {
  MAX_DOSE_LENGTH,
  MAX_MEDICATION_NAME_LENGTH,
  MEDICATION_CLASS_OPTIONS,
  MEDICATION_USE_LABELS,
} from '../../../utils/medication';

export interface MedicationDialogData {
  /** The medication to edit; a new one is added when left out. */
  medication?: Medication;
}

/** Adds or edits one of the user's medications. Closes with the saved medication. */
@Component({
  imports: [
    Dialog,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatRadioModule,
    ReactiveFormsModule,
    OutlinedField,
  ],
  selector: 'app-medication-dialog',
  styleUrl: './medication-dialog.scss',
  templateUrl: './medication-dialog.html',
})
export class MedicationDialog {
  private medicationService = inject(MedicationService);
  private dialogRef = inject<MatDialogRef<MedicationDialog, Medication>>(MatDialogRef);
  private existing = inject<MedicationDialogData | null>(MAT_DIALOG_DATA)?.medication;

  isEdit = !!this.existing;
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  readonly classOptions = MEDICATION_CLASS_OPTIONS;
  readonly useOptions = Object.entries(MEDICATION_USE_LABELS) as [MedicationUse, string][];

  form = new FormGroup({
    name: new FormControl(this.existing?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(MAX_MEDICATION_NAME_LENGTH)],
    }),
    medicationClass: new FormControl<MedicationClass | null>(this.existing?.medicationClass ?? null, {
      validators: [Validators.required],
    }),
    defaultDose: new FormControl(this.existing?.defaultDose ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(MAX_DOSE_LENGTH)],
    }),
    use: new FormControl<MedicationUse>(this.existing?.use ?? 'as_needed', { nonNullable: true }),
  });

  constructor() {
    // Picking the preventive class almost always means it's taken regularly
    this.form.controls.medicationClass.valueChanges.subscribe((value) => {
      if (value === 'preventive') this.form.controls.use.setValue('preventive');
    });
  }

  save() {
    if (this.isSubmitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, medicationClass, defaultDose, use } = this.form.getRawValue();
    const payload = { name: name.trim(), medicationClass: medicationClass!, defaultDose: defaultDose.trim() || null, use };

    this.isSubmitting.set(true);
    this.error.set(null);
    const request = this.existing
      ? this.medicationService.updateMedication(this.existing.id, payload)
      : this.medicationService.createMedication(payload);
    request.subscribe({
      next: (saved) => this.dialogRef.close(saved),
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }
}
