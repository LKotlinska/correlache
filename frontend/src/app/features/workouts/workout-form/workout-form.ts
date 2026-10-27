import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../../components/page-header/page-header';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { Button } from '../../../components/button/button';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OutlinedField } from '../../../components/form-fields/outlined-field/outlined-field';
import { DateTimePicker } from '../../../components/form-fields/date-time-picker/date-time-picker';
import { ExerciseDraftService } from '../../../services/exercise-draft';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Exercise } from '../../../models/workout.model';

function createSetGroup() {
  return new FormGroup({
    weight: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    reps: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
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
  exercises = this.exerciseDraftService.exercises;

  today = new Date();
  
  workoutForm = new FormGroup({
    startDate: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    startTime: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    durationHours: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(23)] }),
    durationMinutes: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(59)] }),
    title: new FormControl<string>('', { validators: [Validators.required]}),
  })

  private setsByExercise = new Map<number, FormArray<SetGroup>>();

  getSets(exerciseId: number): FormArray<SetGroup> {
    let sets = this.setsByExercise.get(exerciseId);
    if (!sets) {
      sets = new FormArray([createSetGroup()]);
      this.setsByExercise.set(exerciseId, sets);
    }
    return sets;
  }

  addSet(exerciseId: number) {
    this.getSets(exerciseId).push(createSetGroup());
  }

  removeSet(exerciseId: number, index: number) {
    this.getSets(exerciseId).removeAt(index);
  }

  muscleNames(exercise: Exercise): string {
    return exercise.muscles.map((m) => m.name).join(', ');
  }
}
