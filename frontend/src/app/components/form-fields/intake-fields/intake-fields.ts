import { Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { Medication } from '../../../models/medication.model';
import { DateTimePicker } from '../date-time-picker/date-time-picker';
import { OutlinedField } from '../outlined-field/outlined-field';
import { DialogService } from '../../dialog/dialog.service';
import { MedicationDialog } from '../../../features/medications/medication-dialog/medication-dialog';
import { maxTimeFor } from '../../../utils/date';
import { INTAKE_EFFECT_OPTIONS, IntakeGroup, isPreventive, selectableMedications } from '../../../utils/medication';

/** The fields of one dose: which medication, how much, when, and whether it helped. */
@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIcon,
    DateTimePicker,
    OutlinedField,
  ],
  selector: 'app-intake-fields',
  styleUrl: './intake-fields.scss',
  templateUrl: './intake-fields.html',
})
export class IntakeFields {
  private dialogService = inject(DialogService);

  group = input.required<IntakeGroup>();
  /** All of the user's medications, archived ones included so an old dose still shows its medication. */
  medications = input.required<Medication[]>();
  /** A medication the user added from here, for the parent to add to its list. */
  medicationAdded = output<Medication>();
  /** Starts the ids of the fields, so a form's error summary can point at them. */
  idPrefix = input('intake');
  /** Whether preventives can be picked; the headache form leaves them out, as they aren't taken for a headache. */
  allowPreventive = input(true);

  readonly effectOptions = INTAKE_EFFECT_OPTIONS;
  readonly today = new Date();

  options(): Medication[] {
    return selectableMedications(this.medications(), this.group().controls.medicationId.value, this.allowPreventive());
  }

  /** Fills in the medication's usual dose, unless a dose was already typed, and drops a relief rating for a preventive. */
  onMedicationChange(id: string) {
    const group = this.group();
    const medication = this.medications().find((m) => m.id === id);
    if (!group.controls.dose.value.trim() && medication?.defaultDose) group.controls.dose.setValue(medication.defaultDose);
    if (isPreventive(medication)) group.patchValue({ effect: null, effectDate: null, effectTime: null });
  }

  /** Preventives are taken regularly, so a single dose isn't rated for relief. */
  isPreventive(): boolean {
    const id = this.group().controls.medicationId.value;
    return isPreventive(this.medications().find((m) => m.id === id));
  }

  addMedication() {
    this.dialogService
      .open(MedicationDialog, {})
      .afterClosed()
      .subscribe((saved) => {
        if (!saved) return;
        const medication = saved as Medication;
        this.medicationAdded.emit(medication);
        this.group().controls.medicationId.setValue(medication.id);
        this.onMedicationChange(medication.id);
      });
  }

  /** The effect time only matters once some relief was noted. */
  showsEffectTime(): boolean {
    const effect = this.group().controls.effect.value;
    return effect === 'some' || effect === 'full';
  }

  takenTimeMax() {
    return maxTimeFor(this.group().controls.takenDate.value);
  }

  effectTimeMax() {
    return maxTimeFor(this.group().controls.effectDate.value);
  }
}
