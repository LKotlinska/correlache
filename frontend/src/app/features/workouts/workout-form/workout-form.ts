import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, merge, Subject } from 'rxjs';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeader } from '../../../components/page-header/page-header';
import { MatStepperModule } from '@angular/material/stepper';
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
  isSubmitting = signal(false);
  private submitted = false;
  exercises = this.exerciseDraftService.exercises;

  today = new Date();
  
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
    // Keep the draft current (not just on destroy) so a refresh doesn't lose edits
    merge(this.workoutForm.valueChanges, this.setsChanged)
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe(() => this.saveDraft());
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
    return !this.submitted && this.exerciseDraftService.hasDraft();
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
    this.workoutService.create(this.buildPayload()).subscribe({
      next: () => {
        this.submitted = true;
        this.exerciseDraftService.clear();
        // Temporary snackbar - should redirect to workout view
        this.snackBar.open('Workout has been added', 'Close', { panelClass: 'snackbar-success' });
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      },
    });
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
