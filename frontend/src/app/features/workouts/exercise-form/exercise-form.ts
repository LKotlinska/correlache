import { Component, computed, effect, inject } from '@angular/core';
import { Exercise } from '../../../models/workout.model';
import { PageHeader } from '../../../components/page-header/page-header';
import { WorkoutService } from '../../../services/workout.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MediaTile } from '../../../components/form-fields/media-tile/media-tile';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor } from '@angular/material/button';
import { ExerciseDraftService } from '../../../services/exercise-draft';
import { Location } from '@angular/common';
import { toggleId } from '../../../utils/toggle-id';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';

@Component({
  imports: [
    PageHeader,
    ScrollingModule,
    MatProgressBar,
    MediaTile,
    MatAnchor,
    MatLabel,
    MatFormField,
    MatPrefix,
    MatInput,
    MatIcon,
    MatChipListbox,
    MatChipOption,
    ReactiveFormsModule,
  ],
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
  searchControl = new FormControl('', { nonNullable: true });
  searchQuery = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  bodyPartControl = new FormControl<number | null>(null);
  bodyPartId = toSignal(this.bodyPartControl.valueChanges, { initialValue: null });

  exercises = rxResource({
    stream: () => this.workoutService.getExercises(),
  });
  
  exerciseForm = new FormControl<number[]>([], { nonNullable: true })

  constructor() {
    this.exerciseForm.setValue(this.exerciseDraft.exercises().map(e => e.id)); // keep earlier picks when re-opening  
  }

  // distinct body parts present in the library, for the filter chips
  bodyParts = computed(() => {
    const byId = new Map((this.exercises.value() ?? []).map((e) => [e.bodyPart.id, e.bodyPart]));
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  });

  items = computed(() => {
    const sq = this.searchQuery().trim().toLowerCase();
    const bodyPartId = this.bodyPartId();
    return (this.exercises.value() ?? []).filter(
      (x) =>
        x.name.toLowerCase().includes(sq) &&
        // a deselected chip emits undefined, so == null covers "no filter"
        (bodyPartId == null || x.bodyPart.id === bodyPartId),
    );
  });

  // the virtual scroll renders one item per row, so group the filtered exercises into rows of `columns`
  rows = computed(() => {
    const list = this.items();
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
    toggleId(this.exerciseForm, id, checked);
  }

  submitExercises() {
    // Look ids up in the full library (not the visible rows) and keep the order they were picked in
    const byId = new Map<number, Exercise>(
      [...this.exerciseDraft.exercises(), ...(this.exercises.value() ?? [])].map((e) => [e.id, e]),
    );
    const selected = this.exerciseForm.value.flatMap((id) => byId.get(id) ?? []);
    this.exerciseDraft.setExercises(selected);
    this.location.back();
  }

}
