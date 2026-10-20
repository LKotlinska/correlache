import { Component, inject, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LookupOption } from '../../models/headache.model';
import { MatIcon } from '@angular/material/icon';
import { MatChipListbox, MatChipOption, MatChip } from '@angular/material/chips';
import { AsyncPipe } from '@angular/common';
import { DialogService } from '../dialog/dialog.service';
import { OptionPicker, OptionPickerData } from './option-picker/option-picker';

@Component({
  imports: [MatButtonModule, MatIcon, MatChipListbox, MatChipOption, MatChip],
  selector: 'app-chip-list',
  styleUrl: './chip-list.scss',
  templateUrl: './chip-list.html',
})
export class ChipList {
  private dialogService = inject(DialogService);
  
  heading = input.required<string>()
  options = input.required<LookupOption[]>()
  selected = model<number[]>([])

  selectedOptions() {
    return this.options().filter(opt => this.selected().includes(opt.id));
  }

  openDialog() {
  const data: OptionPickerData = {
    heading: this.heading(),
    options: this.options(),
    selected: this.selected(),
  };
  this.dialogService
    .open(OptionPicker, data)
    .afterClosed()
    .subscribe(result => {
      if (result) this.selected.set(result);
    });
  }
}
