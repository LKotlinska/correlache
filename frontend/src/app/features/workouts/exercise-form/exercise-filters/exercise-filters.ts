import { Component, inject, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { Dialog } from '../../../../components/dialog/dialog';
import { LookupOption } from '../../../../models/headache.model';
import { toggleId } from '../../../../utils/toggle-id';

export interface ExerciseFilterSelection {
  bodyPartIds: number[];
  equipmentIds: number[];
}

export interface ExerciseFiltersData {
  bodyParts: LookupOption[];
  equipment: LookupOption[];
  /** The page's filters; the dialog edits them in place, so every way of closing keeps what is shown. */
  filters: WritableSignal<ExerciseFilterSelection>;
}

@Component({
  imports: [Dialog, MatChipsModule, MatDialogModule, MatButtonModule],
  selector: 'app-exercise-filters',
  templateUrl: './exercise-filters.html',
})
export class ExerciseFilters {
  data = inject<ExerciseFiltersData>(MAT_DIALOG_DATA);
  filters = this.data.filters;

  toggle(group: keyof ExerciseFilterSelection, id: number, isSelected: boolean) {
    this.filters.update((f) => ({ ...f, [group]: toggleId(f[group], id, isSelected) }));
  }

  clear() {
    this.filters.set({ bodyPartIds: [], equipmentIds: [] });
  }
}
