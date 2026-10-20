import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { Dialog } from '../../dialog/dialog';
import { LookupOption } from '../../../models/headache.model';

export interface OptionPickerData {
  heading: string;
  options: LookupOption[];
  selected: number[];
}

@Component({
  imports: [Dialog, MatChipsModule, MatDialogModule, MatButtonModule],
  selector: 'app-option-picker',
  styleUrl: './option-picker.scss',
  templateUrl: './option-picker.html',
})
export class OptionPicker {
  data = inject<OptionPickerData>(MAT_DIALOG_DATA);
  selected = signal(this.data.selected);

  toggle(id: number, isSelected: boolean) {
    this.selected.update(ids => {
      if (!isSelected) {
        return ids.filter(x => x !== id);
      }
      // Pre-selected chips emit selectionChange on first render, so skip ids we already have
      return ids.includes(id) ? ids : [...ids, id];
    });
  }
}
