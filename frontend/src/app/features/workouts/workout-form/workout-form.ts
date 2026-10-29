import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, merge, Subject } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeader } from '../../../components/page-header/page-header';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatButtonModule } from '@angular/material/button';
import { Button } from '../../../components/button/button';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OutlinedField } from '../../../components/form-fields/outlined-field/outlined-field';
import { DateTimePicker } from '../../../components/form-fields/date-time-picker/date-time-picker';
import { ExerciseDraftService, SetDraft } from '../../../services/exercise-draft';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { CreateWorkoutPayload, Exercise } from '../../../models/workout.model';
import { WorkoutService } from '../../../services/workout.service';
import { combineDateTime } from '../../../utils/combine-date-time';
import { notInFuture } from '../../../utils/date-time-validators';
import { maxTimeFor } from '../../../utils/date';
import { getErrorMessage } from '../../../utils/error-message';
import { workoutToDraft } from '../../../utils/workout-to-draft';

// Same upper bound as the backend (CreateWorkoutSetDto)
const MAX_SET_VALUE = 10000;
const WHOLE_NUMBER = Validators.pattern(/^\d+$/);

function createSetGroup() {
  return new FormGroup({
    weight: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(MAX_SET_VALUE)] }),
    reps: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(MAX_SET_VALUE), WHOLE_NUMBER] }),
  });
}

type SetGroup = ReturnType<typeof createSetGroup>;


@Component({
  imports: [RouterLink, ReactiveFormsModule, MatStepperModule, MatButtonModule, PageHeader, Button, DateTimePicker, OutlinedField, MatExpansionModule, MatIconModule],
  selector: 'app-workout-form',
  styleUrl: './workout-form.scss',
  templateUrl: './workout-form.html',
})
export class WorkoutForm {
  private exerciseDraftService = inject(ExerciseDraftService)
  private workoutService = inject(WorkoutService);
  private snackBar = inject(MatSnackBar); // temporary snackbar
  private router = inject(Router);
  /** Set on the edit route (`:id/edit`); null when adding a new workout. */
  private workoutId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  isEdit = this.workoutId !== null;
  isSubmitting = signal(false);
  private submitted = false;
  exercises = this.exerciseDraftService.exercises;

  today = new Date();

  // reopen on the step the user left, e.g. the exercises step after picking exercises (stepper)
  initialStep = this.exerciseDraftService.step;

  onStepChange(event: StepperSelectionEvent) {
    this.exerciseDraftService.step = event.selectedIndex;
  }

  workoutForm = new FormGroup({
    startDate: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    startTime: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    durationHours: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(23), WHOLE_NUMBER] }),
    durationMinutes: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(59), WHOLE_NUMBER] }),
    title: new FormControl<string>('', { validators: [Validators.required]}),
  }, { validators: [notInFuture] })

  /** Latest selectable start time: now, but only when the start date is today. */
  get startTimeMax(): Date | null {
    return maxTimeFor(this.workoutForm.controls.startDate.value);
  }

  private setsByExercise = new Map<number, FormArray<SetGroup>>();

  constructor() {
    this.initForm();
    // Keep the draft current (not just on destroy) so a refresh doesn't lose edits
    merge(this.workoutForm.valueChanges, this.setsChanged)
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe(() => this.saveDraft());
  }

  private initForm() {
    const draft = this.exerciseDraftService;
    if (!this.workoutId) {
      draft.endEdit();
      this.restoreFromDraft();
      return;
    }
    // Coming back from the exercise picker keeps the edits made so far; any other entry loads the saved workout
    const returningFromPicker = draft.keepEdit && draft.editingId === this.workoutId;
    draft.keepEdit = false;
    if (returningFromPicker) {
      this.restoreFromDraft();
      return;
    }
    this.workoutService.getWorkoutById(this.workoutId).subscribe({
      next: (workout) => {
        draft.startEdit(workout.id, workoutToDraft(workout));
        this.restoreFromDraft();
      },
      error: () => this.snackBar.open("Couldn't load this workout", 'Close', { panelClass: 'snackbar-error' }),
    });
  }

  private restoreFromDraft() {
    const draft = this.exerciseDraftService;
    if (draft.form) {
      this.workoutForm.patchValue(draft.form);
    }
    for (const exercise of draft.exercises()) {
      const saved = draft.sets[exercise.id];
      if (saved?.length) {
        this.setsByExercise.set(exercise.id, new FormArray(saved.map((s) => this.createSetGroup(s))));
      }
    }
  }

  /** Remembers the edits while the exercise picker is open. */
  onAddExercise() {
    this.exerciseDraftService.keepEdit = this.isEdit;
  }

  /** Emits whenever any set is added, removed or edited. */
  private setsChanged = new Subject<void>();

  private createSetGroup(value?: SetDraft) {
    const group = createSetGroup();
    if (value) group.patchValue(value);
    group.valueChanges.subscribe(() => this.setsChanged.next());
    return group;
  }

  private saveDraft() {
    if (this.submitted) return; // a late debounced save must not bring a saved workout back as a draft
    const sets: Record<number, SetDraft[]> = {};
    for (const [id, array] of this.setsByExercise) {
      sets[id] = array.getRawValue();
    }
    this.exerciseDraftService.saveForm(this.workoutForm.getRawValue(), sets);
  }

  hasDraft() {
    return !this.isEdit && !this.submitted && this.exerciseDraftService.hasDraft();
  }

  discardDraft() {
    this.exerciseDraftService.clear();
  }

  getSets(exerciseId: number): FormArray<SetGroup> {
    let sets = this.setsByExercise.get(exerciseId);
    if (!sets) {
      sets = new FormArray([this.createSetGroup()]);
      this.setsByExercise.set(exerciseId, sets);
    }
    return sets;
  }

  addSet(exerciseId: number) {
    this.getSets(exerciseId).push(this.createSetGroup());
    this.setsChanged.next();
  }

  removeSet(exerciseId: number, index: number) {
    this.getSets(exerciseId).removeAt(index);
    this.setsChanged.next();
  }

  /** Removes the exercise together with its sets, so none are left behind in the draft or payload. */
  removeExercise(exerciseId: number) {
    this.setsByExercise.delete(exerciseId);
    this.exerciseDraftService.setExercises(this.exercises().filter((e) => e.id !== exerciseId));
    this.setsChanged.next();
  }

  onSubmit() {
    if (this.isSubmitting()) {
      return;
    }
    const exercises = this.exercises();
    const setsInvalid = exercises.some((e) => this.getSets(e.id).invalid);
    if (this.workoutForm.invalid || setsInvalid) {
      this.workoutForm.markAllAsTouched();
      exercises.forEach((e) => this.getSets(e.id).markAllAsTouched());
      return;
    }
    if (exercises.length === 0) {
      this.snackBar.open('Add at least one exercise', 'Close', { panelClass: 'snackbar-error' });
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.buildPayload();
    const request = this.workoutId
      ? this.workoutService.update(this.workoutId, payload)
      : this.workoutService.create(payload);
    request.subscribe({
      next: () => this.onSaved(),
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      },
    });
  }

  private onSaved() {
    this.submitted = true;
    if (this.workoutId) {
      this.exerciseDraftService.endEdit();
      this.router.navigate(['/user/workout', this.workoutId], { replaceUrl: true });
      return;
    }
    this.exerciseDraftService.clear();
    // Temporary snackbar - should redirect to workout view
    this.snackBar.open('Workout has been added', 'Close', { panelClass: 'snackbar-success' });
  }

  private buildPayload(): CreateWorkoutPayload {
    const { startDate, startTime, durationHours, durationMinutes, title } = this.workoutForm.getRawValue();
    return {
      title: title!.trim(),
      startedAt: combineDateTime(startDate!, startTime),
      durationSeconds: ((durationHours ?? 0) * 60 + (durationMinutes ?? 0)) * 60,
      exercises: this.exercises().map((exercise) => ({
        exerciseId: exercise.id,
        // Rows left completely empty are not saving
        sets: this.getSets(exercise.id)
          .getRawValue()
          .filter((set) => set.weight !== null || set.reps !== null),
      })),
    };
  }

  muscleNames(exercise: Exercise): string {
    return exercise.muscles.map((m) => m.name).join(', ');
  }
}
