import { Component, inject, signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { Dialog } from '../../../../components/dialog/dialog';
import { LookupOption } from '../../../../models/headache.model';

export interface ExerciseFilterSelection {
  bodyPartIds: number[];
  equipmentIds: number[];
}

export interface ExerciseFiltersData {
  bodyParts: LookupOption[];
  equipment: LookupOption[];
  selected: ExerciseFilterSelection;
}

@Component({
  imports: [Dialog, MatChipsModule, MatDialogModule, MatButtonModule],
  selector: 'app-exercise-filters',
  styleUrl: './exercise-filters.scss',
  templateUrl: './exercise-filters.html',
})
export class ExerciseFilters {
  data = inject<ExerciseFiltersData>(MAT_DIALOG_DATA);
  bodyPartIds = signal(this.data.selected.bodyPartIds);
  equipmentIds = signal(this.data.selected.equipmentIds);

  toggle(ids: WritableSignal<number[]>, id: number, isSelected: boolean) {
    ids.update(current => {
      if (!isSelected) return current.filter(x => x !== id);
      // Pre-selected chips emit selectionChange on first render, so skip ids we already have
      return current.includes(id) ? current : [...current, id];
    });
  }

  clear() {
    this.bodyPartIds.set([]);
    this.equipmentIds.set([]);
  }

  result(): ExerciseFilterSelection {
    return { bodyPartIds: this.bodyPartIds(), equipmentIds: this.equipmentIds() };
  }
}
