import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, tap } from 'rxjs';
import { DraftStorage, HEADACHE_DRAFT_KEY } from '../../../services/draft-storage';
import { DraftController } from '../../../services/draft-controller';
import { FormArray, FormGroup, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { FormErrorSummary, FormProblem } from '../../../components/form-error-summary/form-error-summary';
import { HeadacheService } from '../../../services/headache.service';
import { AsyncPipe } from '@angular/common';
import { MediaTile } from '../../../components/form-fields/media-tile/media-tile';
import { ChipList } from '../../../components/chip-list/chip-list';
import { DateTimePicker } from '../../../components/form-fields/date-time-picker/date-time-picker';
import { PageHeader } from '../../../components/page-header/page-header';
import { Button } from '../../../components/button/button';
import { buildTimestamps, endNotBeforeStart, notInFuture } from '../../../utils/date-time-validators';
import { dayLabel, formatTime, isOnOrAfterDay, isSameDay, maxTimeFor } from '../../../utils/date';
import { toggleId } from '../../../utils/toggle-id';
import { getErrorMessage } from '../../../utils/error-message';
import { CreateHeadachePayload } from '../../../models/headache.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ErrorMessage } from '../../../components/error-message/error-message';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { HeadacheDetail } from '../../../models/headache.model';
import { Medication } from '../../../models/medication.model';
import { MedicationService } from '../../../services/medication.service';
import { IntakeFields } from '../../../components/form-fields/intake-fields/intake-fields';
import { createIntakeGroup, defaultTakenAt, IntakeGroup, IntakeGroupValue, intakeGroupToPayload, intakeProblems, intakeToGroupValue, isPreventive } from '../../../utils/medication';
import { combineDateTime } from '../../../utils/combine-date-time';
import { headacheLocationUrl } from '../../../utils/image-urls';

/** Indexes of the steps that hold fields that can be invalid. */
const STEP_WHEN = 0;
const STEP_MEDICATIONS = 3;

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    AsyncPipe,
    MediaTile,
    ChipList,
    Button,
    PageHeader,
    DateTimePicker,
    IntakeFields,
    MatIcon,
    MatExpansionModule,
    FormErrorSummary,
    MatProgressBar,
    ErrorMessage,
],
  selector: 'app-headache-form',
  styleUrl: './headache-form.scss',
  templateUrl: './headache-form.html',
})
export class HeadacheForm {
  private headacheService = inject(HeadacheService);
  private medicationService = inject(MedicationService);
  private snackBar = inject(MatSnackBar); // temporary snackbar
  private router = inject(Router);
  private draft = new DraftController(inject(DraftStorage), HEADACHE_DRAFT_KEY);
  /** Set on the edit route (`:id/edit`); null when adding a new headache. */
  private headacheId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  isEdit = this.headacheId !== null;
  options = this.headacheService.getOptions();
  isSubmitting = signal(false);
  protected readonly locationImage = headacheLocationUrl;
  /** Latest selectable date: headaches can't be logged in the future. */
  today = new Date();

  headacheForm = new FormGroup({
    startDate: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    startTime: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    endDate: new FormControl<Date | null>(null),
    endTime: new FormControl<Date | null>(null),
    painLevel: new FormControl<number>(1, { validators: [Validators.required], nonNullable: true }),
    locationIds: new FormControl<number[]>([], { nonNullable: true }),
    triggerIds: new FormControl<number[]>([], { nonNullable: true }),
    symptomIds: new FormControl<number[]>([], { nonNullable: true }),
    reliefIds: new FormControl<number[]>([], { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
    intakes: new FormArray<IntakeGroup>([]),
  }, { validators: [endNotBeforeStart, notInFuture] })

  /**
   * The headache being edited; idle when adding. The form only shows once it has loaded, so a save can never
   * overwrite the headache with the form's defaults.
   */
  protected readonly saved = rxResource({
    params: () => this.headacheId ?? undefined,
    stream: ({ params: id }) => this.headacheService.getHeadacheById(id).pipe(tap((h) => this.fillForm(h))),
  });

  /** Archived medications are included so a saved dose still shows its medication. */
  private loadedMedications = rxResource({ stream: () => this.medicationService.getMedications(true) });
  private addedMedications = signal<Medication[]>([]);
  medications = computed(() => [...(this.loadedMedications.value() ?? []), ...this.addedMedications()]);
  /** Index of the expanded dose panel; a newly added dose opens so it can be filled in. */
  openIntake = signal<number | null>(null);
  /** Saved doses the form loaded, so the ones removed here can be told apart from ones linked elsewhere meanwhile. */
  private loadedIntakeIds: string[] = [];

  private stepper = viewChild.required<MatStepper>('stepper');
  /** Set by a save with problems; the error summary then shows until they are fixed. */
  showErrors = signal(false);

  constructor() {
    if (this.headacheId) return;
    // New headaches keep a draft in sessionStorage; editing is prefilled from the server instead
    const draft = this.draft.restore<Record<string, unknown> & { intakes?: IntakeGroupValue[] }>();
    if (draft) {
      // patchValue only fills doses that already have a group
      this.setIntakes(draft.intakes ?? []);
      this.headacheForm.patchValue(draft);
    }
    this.headacheForm.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe(() => this.draft.save(this.headacheForm.getRawValue()));
  }

  hasDraft() {
    return !this.headacheId && this.draft.hasDraft();
  }

  discardDraft() {
    this.draft.discard();
  }

  /** Pre-fills the form with an existing headache so it can be edited. */
  private fillForm(h: HeadacheDetail) {
    const started = new Date(h.startedAt);
    const ended = h.endedAt ? new Date(h.endedAt) : null;
    this.headacheForm.patchValue({
      startDate: started,
      startTime: started,
      endDate: ended,
      endTime: ended,
      painLevel: h.painLevel,
      notes: h.notes ?? '',
      locationIds: h.locations.map((o) => o.id),
      triggerIds: h.triggers.map((o) => o.id),
      symptomIds: h.symptoms.map((o) => o.id),
      reliefIds: h.reliefMeasures.map((o) => o.id),
    });
    // Doses of a medication since marked preventive can't be edited here, as preventives aren't linked to headaches;
    // left out of the form, they are kept as they are
    const intakes = h.intakes.filter((i) => !isPreventive(i.medication));
    this.loadedIntakeIds = intakes.map((i) => i.id);
    this.setIntakes(intakes.map(intakeToGroupValue));
  }

  private setIntakes(values: Partial<IntakeGroupValue>[]) {
    const intakes = this.headacheForm.controls.intakes;
    intakes.clear({ emitEvent: false });
    for (const value of values) intakes.push(createIntakeGroup(value), { emitEvent: false });
  }

  /** Adds a dose, taken now while the headache is ongoing and at its start otherwise. */
  addIntake() {
    const { startDate, startTime, endDate } = this.headacheForm.getRawValue();
    const start = startDate ? new Date(combineDateTime(startDate, startTime)) : null;
    const takenAt = defaultTakenAt(start, endDate);
    const intakes = this.headacheForm.controls.intakes;
    intakes.push(createIntakeGroup({ takenDate: takenAt, takenTime: takenAt }));
    this.openIntake.set(intakes.length - 1);
  }

  removeIntake(index: number) {
    this.headacheForm.controls.intakes.removeAt(index);
    const open = this.openIntake();
    // Keep the same panel open as the ones after the removed dose shift up
    if (open === index) this.openIntake.set(null);
    else if (open !== null && open > index) this.openIntake.set(open - 1);
  }

  /** The chosen medication's name, or "Medication 2" until one is picked. */
  intakeTitle(group: IntakeGroup, index: number): string {
    const id = group.controls.medicationId.value;
    return this.medications().find((m) => m.id === id)?.name ?? `Medication ${index + 1}`;
  }

  /** "400 mg · Today, 14:05". */
  intakeSubtitle(group: IntakeGroup): string {
    const { dose, takenDate, takenTime } = group.getRawValue();
    const taken = takenDate ? new Date(combineDateTime(takenDate, takenTime)) : null;
    return [dose.trim(), taken && `${dayLabel(taken)}, ${formatTime(taken)}`].filter(Boolean).join(' · ');
  }

  onMedicationAdded(medication: Medication) {
    this.addedMedications.update((list) => [...list, medication]);
  }

  isSelected(id: number) {
    return this.headacheForm.controls.locationIds.value.includes(id);
  }

  toggleLocation(id: number, checked: boolean) {
    const control = this.headacheForm.controls.locationIds;
    control.setValue(toggleId(control.value, id, checked));
  }

  /** Earliest selectable end time: the start time, but only when both fall on the same day. */
  get endTimeMin(): Date | null {
    const { startDate, startTime, endDate } = this.headacheForm.controls;
    if (startDate.value && endDate.value && startTime.value && isSameDay(startDate.value, endDate.value)) {
      return startTime.value;
    }
    return null;
  }

  /** Latest selectable start time: now, but only when the start date is today. */
  get startTimeMax(): Date | null {
    return maxTimeFor(this.headacheForm.controls.startDate.value);
  }

  /** Latest selectable end time: now, but only when the end date is today. */
  get endTimeMax(): Date | null {
    return maxTimeFor(this.headacheForm.controls.endDate.value);
  }

  endDateFilter = (d: Date | null): boolean => {
    // Prevent end date from traveling back in time.
    const start = this.headacheForm.controls.startDate.value;
    if (d === null) {
      return false;
    }
    return !start || isOnOrAfterDay(d, start);
  };

  /** What stops the headache from saving, each pointing at its step and field. */
  problems(): FormProblem[] {
    const { startDate, startTime } = this.headacheForm.controls;
    const whenStep = () => this.openStep(STEP_WHEN);
    const problems: FormProblem[] = [];
    if (startDate.invalid || startTime.invalid) {
      problems.push({ message: 'Start: pick a date and time', target: 'headache-start', reveal: whenStep });
    }
    if (this.headacheForm.hasError('endBeforeStart')) {
      problems.push({ message: "The end can't be before the start", target: 'headache-end', reveal: whenStep });
    }
    if (this.headacheForm.hasError('futureDate')) {
      problems.push({ message: "Headaches can't be logged in the future", target: 'headache-start', reveal: whenStep });
    }
    this.headacheForm.controls.intakes.controls.forEach((intake, i) => {
      const reveal = () => {
        this.openStep(STEP_MEDICATIONS);
        this.openIntake.set(i);
      };
      for (const problem of intakeProblems(intake, `intake-${i}`, this.intakeTitle(intake, i))) {
        problems.push({ ...problem, reveal });
      }
    });
    return problems;
  }

  private openStep(index: number) {
    this.stepper().selectedIndex = index;
  }

  onSubmit() {
    // The form is hidden until then; this also stops a stray submit from saving the defaults over the headache
    if (this.isSubmitting() || (this.isEdit && !this.saved.hasValue())) {
      return;
    }
    if (this.headacheForm.invalid) {
      this.headacheForm.markAllAsTouched();
      this.showErrors.set(true);
      // Open where the first problem is, so something visible changes even before the summary is read
      this.problems()[0]?.reveal?.();
      return;
    }
    const { startDate, startTime, endDate, endTime, intakes: _, ...fields} = this.headacheForm.getRawValue();

    const intakes = this.headacheForm.controls.intakes.controls.map(intakeGroupToPayload);
    const payload: CreateHeadachePayload = {
      ...fields,
      ...buildTimestamps(startDate!, startTime, endDate, endTime),
      intakes,
      removedIntakeIds: this.loadedIntakeIds.filter((id) => !intakes.some((i) => i.id === id)),
    };

    this.isSubmitting.set(true);
    const request = this.headacheId
      ? this.headacheService.update(this.headacheId, payload)
      : this.headacheService.create(payload);
    request.subscribe({
      next: (saved) => {
        this.draft.markSubmitted();
        this.router.navigate(['/user/headache', this.headacheId ?? saved.id], { replaceUrl: true });
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        // Temporary error - should show in component
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      }
    });
  }
}
