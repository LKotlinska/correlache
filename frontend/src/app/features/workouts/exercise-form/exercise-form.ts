import { Component, computed, inject } from '@angular/core';
import { Exercise } from '../../../models/workout.model';
import { PageHeader } from '../../../components/page-header/page-header';
import { WorkoutService } from '../../../services/workout.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MediaTile } from '../../../components/form-fields/media-tile/media-tile';
import { FormControl } from '@angular/forms';
import { MatAnchor } from '@angular/material/button';
import { ExerciseDraftService } from '../../../services/exercise-draft';
import { Location } from '@angular/common';

@Component({
  imports: [
    PageHeader, 
    ScrollingModule, 
    MatProgressBar,
    MediaTile, 
    MatAnchor],
  selector: 'app-exercise-form',
  styleUrl: './exercise-form.scss',
  templateUrl: './exercise-form.html',
})
export class ExerciseForm {
  private workoutService = inject(WorkoutService);
  private exerciseDraft = inject(ExerciseDraftService)
  private location = inject(Location);

  // must match the row height and columns set in exercise-form.scss
  readonly columns = 2;
  readonly rowHeight = 245;

  exercises = rxResource({
    stream: () => this.workoutService.getExercises(),
  });
  
  exerciseForm = new FormControl<number[]>([], { nonNullable: true })

  constructor() {
    this.exerciseForm.setValue(this.exerciseDraft.exercises().map(e => e.id)); // keep earlier picks when re-opening
  }

  // the virtual scroll renders one item per row, so group the exercises into rows of `columns`
  rows = computed(() => {
    const list = this.exercises.value() ?? [];
    const rows: Exercise[][] = [];
    for (let i = 0; i < list.length; i += this.columns) {
      rows.push(list.slice(i, i + this.columns));
    }
    return rows;
  });

  isSelected(id: number) {
    return this.exerciseForm.value.includes(id);
  }

  toggleExercise(id: number, checked: boolean) {
    const control = this.exerciseForm;
    const currentIds = control.value;

    if (checked) {
      // Add ids when selected
      control.setValue([...currentIds, id]);
    } else {
      // Remove this id when unselected
      control.setValue(currentIds.filter(x => x !== id));
    }
  }

  submitExercises() {
    const ids = this.exerciseForm.value;
    const selected = this.exercises.value()!.filter(e => ids.includes(e.id));
    this.exerciseDraft.exercises.set(selected);
    this.location.back();
  }

}
