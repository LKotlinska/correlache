import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, map, merge, startWith, tap } from 'rxjs';
import { ErrorMessage } from '../../../components/error-message/error-message';
import { PageHeader } from '../../../components/page-header/page-header';
import { Button } from '../../../components/button/button';
import { IntakeFields } from '../../../components/form-fields/intake-fields/intake-fields';
import { FormErrorSummary, FormProblem } from '../../../components/form-error-summary/form-error-summary';
import { Headache } from '../../../models/headache.model';
import { Medication } from '../../../models/medication.model';
import { HeadacheService } from '../../../services/headache.service';
import { MedicationService } from '../../../services/medication.service';
import { combineDateTime } from '../../../utils/combine-date-time';
import { dayLabel, formatTime } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/error-message';
import {
  createIntakeGroup,
  findOverlappingHeadaches,
  intakeGroupToPayload,
  intakeProblems,
  intakeToGroupValue,
  isPreventive,
  OPEN_HEADACHE_WINDOW_MS,
} from '../../../utils/medication';

/** The radio option for a dose that wasn't taken for any of the listed headaches. */
export const NO_HEADACHE = 'none';

/** Logs a dose on its own (no headache, or a preventive), offering the headaches that overlap it to link to. */
@Component({
  imports: [
    ReactiveFormsModule,
    MatRadioModule,
    FormErrorSummary,
    MatProgressBar,
    PageHeader,
    Button,
    IntakeFields,
    ErrorMessage,
  ],
  selector: 'app-intake-form',
  styleUrl: './intake-form.scss',
  templateUrl: './intake-form.html',
})
export class IntakeForm {
  private medicationService = inject(MedicationService);
  private headacheService = inject(HeadacheService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  /** Set on the edit route (`:id/edit`); null when adding a new dose. */
  private intakeId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  isEdit = this.intakeId !== null;
  isSubmitting = signal(false);

  group = createIntakeGroup();
  /** The headache the dose was taken for, `NO_HEADACHE`, or null while nothing is chosen. */
  headacheChoice = new FormControl<string | null>(null);
  readonly noHeadache = NO_HEADACHE;
  /** Set by a save with problems; the error summary then shows until they are fixed. */
  showErrors = signal(false);

  /** Archived medications are included so an old dose still shows its medication. */
  loadedMedications = rxResource({ stream: () => this.medicationService.getMedications(true) });
  private addedMedications = signal<Medication[]>([]);
  medications = computed(() => [...(this.loadedMedications.value() ?? []), ...this.addedMedications()]);
  hasNoMedications = computed(() => this.loadedMedications.hasValue() && this.medications().length === 0);

  /**
   * The dose being edited; idle when adding. The form only shows once it has loaded, so a save can never
   * overwrite the dose with the form's defaults.
   */
  protected readonly saved = rxResource({
    params: () => this.intakeId ?? undefined,
    stream: ({ params: id }) =>
      this.medicationService.getIntakeById(id).pipe(
        tap((intake) => {
          this.group.patchValue(intakeToGroupValue(intake));
          if (intake.headacheId) this.headacheChoice.setValue(intake.headacheId);
        }),
      ),
  });

  /** The headache the saved dose is linked to, or null. */
  private linkedHeadacheId = computed(() => (this.saved.hasValue() ? this.saved.value().headacheId : null));

  /** That headache, to show it as a choice. */
  private linkedHeadache = rxResource({
    params: () => this.linkedHeadacheId() ?? undefined,
    stream: ({ params: id }) => this.headacheService.getHeadacheById(id),
  });

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
        .getHeadaches({
          from: new Date(takenAt.getTime() - OPEN_HEADACHE_WINDOW_MS),
          to: new Date(takenAt.getTime() + 1),
        })
        .pipe(map((headaches) => findOverlappingHeadaches(headaches, takenAt))),
  });

  private medicationId = toSignal(this.group.controls.medicationId.valueChanges, { initialValue: null });

  /** Preventives are taken regularly, not for a headache, so they aren't offered a link. */
  private preventive = computed(() => isPreventive(this.medications().find((m) => m.id === this.medicationId())));

  /** Headaches to choose from: the one already linked, then those that overlap the dose. None for a preventive. */
  headacheOptions = computed<Headache[]>(() => {
    if (this.preventive()) return [];
    const linked = this.linkedHeadache.hasValue() ? this.linkedHeadache.value() : null;
    const overlapping = (this.overlapping.value() ?? []).filter((h) => h.id !== linked?.id);
    return linked ? [linked, ...overlapping] : overlapping;
  });

  onMedicationAdded(medication: Medication) {
    this.addedMedications.update((list) => [...list, medication]);
  }

  headacheLabel(h: Headache): string {
    const start = new Date(h.startedAt);
    const end = h.endedAt ? ` – ${formatTime(new Date(h.endedAt))}` : '';
    return `${dayLabel(start)}, ${formatTime(start)}${end} · pain ${h.painLevel}/10`;
  }

  problems(): FormProblem[] {
    return intakeProblems(this.group, 'dose');
  }

  onSubmit() {
    // The form is hidden until then; this also stops a stray submit from saving over the dose
    if (this.isSubmitting() || (this.isEdit && !this.saved.hasValue())) return;
    if (this.group.invalid) {
      this.group.markAllAsTouched();
      this.showErrors.set(true);
      return;
    }
    const { id: _, ...fields } = intakeGroupToPayload(this.group);
    // The saved link counts even before (or without) its headache loading to be shown; another headache only while
    // still on offer, as changing the time can take it away. Preventives are never linked.
    const choice = this.headacheChoice.value;
    const offered = choice === this.linkedHeadacheId() || this.headacheOptions().some((h) => h.id === choice);
    const headacheId = offered && !this.preventive() ? choice : null;
    const payload = { ...fields, headacheId };

    this.isSubmitting.set(true);
    const request = this.intakeId
      ? this.medicationService.updateIntake(this.intakeId, payload)
      : this.medicationService.createIntake(payload);
    request.subscribe({
      next: (saved) => this.router.navigate(['/user/medication', this.intakeId ?? saved.id], { replaceUrl: true }),
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      },
    });
  }
}
