import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { Dialog } from '../../../../components/dialog/dialog';
import { Exercise } from '../../../../models/workout.model';
import { searchExercises } from '../exercise-matching';

export interface ExercisePickerData {
  /** The exported name being matched, shown in the heading and used as the first search */
  exportedName: string;
  library: Exercise[];
}

const MAX_RESULTS = 30;

/** Searches the exercise library for one exported name. Closes with the chosen exercise. */
@Component({
  imports: [Dialog, MatDialogModule, MatFormField, MatLabel, MatPrefix, MatInput, MatIcon],
  selector: 'app-exercise-picker-dialog',
  styleUrl: './exercise-picker-dialog.scss',
  templateUrl: './exercise-picker-dialog.html',
})
export class ExercisePickerDialog {
  readonly data = inject<ExercisePickerData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<ExercisePickerDialog, Exercise>>(MatDialogRef);

  readonly query = signal(this.data.exportedName);

  // One more than shown, to know whether there are more
  private found = computed(() => searchExercises(this.data.library, this.query(), MAX_RESULTS + 1));
  readonly results = computed(() => this.found().slice(0, MAX_RESULTS));
  readonly hasMore = computed(() => this.found().length > MAX_RESULTS);

  search(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  pick(exercise: Exercise) {
    this.dialogRef.close(exercise);
  }
}
