import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Exercise } from '../../../models/workout.model';
import { LookupOption } from '../../../models/headache.model';
import { PageHeader } from '../../../components/page-header/page-header';
import { WorkoutService } from '../../../services/workout.service';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MediaTile } from '../../../components/form-fields/media-tile/media-tile';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { ExerciseDraftService } from '../../../services/exercise-draft';
import { toggleId } from '../../../utils/toggle-id';
import { injectGoBack } from '../../../utils/go-back';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatBadge } from '@angular/material/badge';
import { DialogService } from '../../../components/dialog/dialog.service';
import { ExerciseFilters, ExerciseFilterSelection, ExerciseFiltersData } from './exercise-filters/exercise-filters';

/** Distinct options picked out of `list` by `pick`, sorted by name. */
function distinctSorted<T>(list: T[], pick: (item: T) => LookupOption): LookupOption[] {
  const byId = new Map(list.map((item) => [pick(item).id, pick(item)]));
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

@Component({
  imports: [
    PageHeader,
    ScrollingModule,
    MatProgressBar,
    MediaTile,
    MatAnchor,
    MatButton,
    MatIconButton,
    MatLabel,
    MatFormField,
    MatPrefix,
    MatInput,
    MatIcon,
    MatBadge,
    ReactiveFormsModule,
  ],
  selector: 'app-exercise-form',
  styleUrl: './exercise-form.scss',
  templateUrl: './exercise-form.html',
})
export class ExerciseForm {
  private workoutService = inject(WorkoutService);
  private exerciseDraft = inject(ExerciseDraftService);
  private dialogService = inject(DialogService);
  private goBack = injectGoBack();

  // must match the row height and columns set in exercise-form.scss
  readonly columns = 2;
  readonly rowHeight = 245;
  searchControl = new FormControl('', { nonNullable: true });
  searchQuery = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  // an empty list means no filter for that group
  filters = signal<ExerciseFilterSelection>({ bodyPartIds: [], equipmentIds: [] });
  activeFilterCount = computed(() => this.filters().bodyPartIds.length + this.filters().equipmentIds.length);

  exercises = rxResource({
    stream: () => this.workoutService.getExercises(),
  });

  // keeps earlier picks when re-opening, and unsaved ticks across a refresh
  exerciseForm = new FormControl<number[]>(this.exerciseDraft.restorePicks(), { nonNullable: true });

  constructor() {
    this.exerciseForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((ids) => this.exerciseDraft.savePicks(ids));
    // a refresh doesn't destroy the component, so the ticks only survive that
    inject(DestroyRef).onDestroy(() => this.exerciseDraft.clearPicks());
  }

  // distinct body parts and equipment present in the library, for the filter dialog
  bodyParts = computed(() => distinctSorted(this.exercises.value() ?? [], (e) => e.bodyPart));
  equipmentOptions = computed(() => distinctSorted(this.exercises.value() ?? [], (e) => e.equipment));

  items = computed(() => {
    const sq = this.searchQuery().trim().toLowerCase();
    const { bodyPartIds, equipmentIds } = this.filters();
    return (this.exercises.value() ?? []).filter(
      (x) =>
        x.name.toLowerCase().includes(sq) &&
        (bodyPartIds.length === 0 || bodyPartIds.includes(x.bodyPart.id)) &&
        (equipmentIds.length === 0 || equipmentIds.includes(x.equipment.id)),
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

  openFilters() {
    const data: ExerciseFiltersData = {
      bodyParts: this.bodyParts(),
      equipment: this.equipmentOptions(),
      filters: this.filters,
    };
    this.dialogService.open(ExerciseFilters, data);
  }

  clearFilters() {
    this.filters.set({ bodyPartIds: [], equipmentIds: [] });
  }

  isSelected(id: number) {
    return this.exerciseForm.value.includes(id);
  }

  toggleExercise(id: number, checked: boolean) {
    this.exerciseForm.setValue(toggleId(this.exerciseForm.value, id, checked));
  }

  submitExercises() {
    // Look ids up in the full library (not the visible rows) and keep the order they were picked in
    const byId = new Map<number, Exercise>(
      [...this.exerciseDraft.exercises(), ...(this.exercises.value() ?? [])].map((e) => [e.id, e]),
    );
    const selected = this.exerciseForm.value.flatMap((id) => byId.get(id) ?? []);
    this.exerciseDraft.setExercises(selected);
    // same fallback as the header's back button, for when the picker was opened directly or reloaded
    this.goBack('..');
  }
}
