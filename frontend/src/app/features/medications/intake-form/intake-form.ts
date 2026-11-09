import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, map, merge, startWith } from 'rxjs';
import { PageHeader } from '../../../components/page-header/page-header';
import { Button } from '../../../components/button/button';
import { IntakeFields } from '../../../components/form-fields/intake-fields/intake-fields';
import { ConfirmDialog, ConfirmDialogData } from '../../../components/dialog/confirm-dialog/confirm-dialog';
import { DialogService } from '../../../components/dialog/dialog.service';
import { Headache } from '../../../models/headache.model';
import { Medication } from '../../../models/medication.model';
import { HeadacheService } from '../../../services/headache.service';
import { MedicationService } from '../../../services/medication.service';
import { combineDateTime } from '../../../utils/combine-date-time';
import { dayLabel, formatTime } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/error-message';
import {
  createIntakeGroup,
  findOverlappingHeadache,
  intakeGroupToPayload,
  intakeToGroupValue,
} from '../../../utils/medication';

/** How far back to look for a headache the dose may belong to; matches the open-headache window. */
const LOOKBACK_MS = 72 * 60 * 60 * 1000;

/** Logs a dose on its own (no headache, or a preventive), suggesting a link when a headache overlaps it. */
@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIcon,
    MatProgressBar,
    PageHeader,
    Button,
    IntakeFields,
  ],
  selector: 'app-intake-form',
  styleUrl: './intake-form.scss',
  templateUrl: './intake-form.html',
})
export class IntakeForm {
  private medicationService = inject(MedicationService);
  private headacheService = inject(HeadacheService);
  private dialogService = inject(DialogService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  /** Set on the edit route (`:id/edit`); null when adding a new dose. */
  private intakeId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  isEdit = this.intakeId !== null;
  isSubmitting = signal(false);

  group = createIntakeGroup();
  linkToHeadache = new FormControl(true, { nonNullable: true });

  /** Archived medications are included so an old dose still shows its medication. */
  loadedMedications = rxResource({ stream: () => this.medicationService.getMedications(true) });
  private addedMedications = signal<Medication[]>([]);
  medications = computed(() => [...(this.loadedMedications.value() ?? []), ...this.addedMedications()]);
  hasNoMedications = computed(() => this.loadedMedications.hasValue() && this.medications().length === 0);

  /** The headache a saved dose is already linked to. */
  private linkedHeadache = signal<Headache | null>(null);

  /** When the dose was taken, once both date and time are filled in. */
  private takenAt = toSignal(
    merge(this.group.controls.takenDate.valueChanges, this.group.controls.takenTime.valueChanges).pipe(
      startWith(null),
      debounceTime(200),
      map(() => {
        const { takenDate, takenTime } = this.group.getRawValue();
        return takenDate && takenTime ? new Date(combineDateTime(takenDate, takenTime)) : undefined;
      }),
    ),
  );

  private overlapping = rxResource({
    params: () => this.takenAt(),
    stream: ({ params: takenAt }) =>
      this.headacheService
        .getHeadaches({ from: new Date(takenAt.getTime() - LOOKBACK_MS), to: new Date(takenAt.getTime() + 1) })
        .pipe(map((headaches) => findOverlappingHeadache(headaches, takenAt))),
  });

  /** The headache offered for linking: the one already linked, else one that overlaps the dose. */
  suggestedHeadache = computed(() => this.linkedHeadache() ?? this.overlapping.value() ?? null);

  constructor() {
    if (this.intakeId) {
      this.medicationService.getIntakeById(this.intakeId).subscribe({
        next: (intake) => {
          this.group.patchValue(intakeToGroupValue(intake));
          if (intake.headacheId) {
            this.headacheService.getHeadacheById(intake.headacheId).subscribe((h) => this.linkedHeadache.set(h));
          }
        },
        error: () => this.snackBar.open("Couldn't load this dose", 'Close', { panelClass: 'snackbar-error' }),
      });
    }
  }

  onMedicationAdded(medication: Medication) {
    this.addedMedications.update((list) => [...list, medication]);
  }

  headacheLabel(h: Headache): string {
    const start = new Date(h.startedAt);
    return `Headache from ${dayLabel(start).toLowerCase()}, ${formatTime(start)} · pain ${h.painLevel}/10`;
  }

  onSubmit() {
    if (this.isSubmitting()) return;
    if (this.group.invalid) {
      this.group.markAllAsTouched();
      return;
    }
    const { id: _, ...fields } = intakeGroupToPayload(this.group);
    const headache = this.suggestedHeadache();
    const payload = { ...fields, headacheId: headache && this.linkToHeadache.value ? headache.id : null };

    this.isSubmitting.set(true);
    const request = this.intakeId
      ? this.medicationService.updateIntake(this.intakeId, payload)
      : this.medicationService.createIntake(payload);
    request.subscribe({
      next: () => this.router.navigate(['/user/diary'], { replaceUrl: true }),
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      },
    });
  }

  confirmDelete() {
    const data: ConfirmDialogData = { heading: 'Delete dose?', message: "This can't be undone.", confirmLabel: 'Delete' };
    this.dialogService
      .open(ConfirmDialog, data)
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed || !this.intakeId) return;
        this.medicationService.deleteIntake(this.intakeId).subscribe({
          next: () => this.router.navigate(['/user/diary'], { replaceUrl: true }),
          error: () => this.snackBar.open("Couldn't delete this dose", 'Close', { panelClass: 'snackbar-error' }),
        });
      });
  }
}
