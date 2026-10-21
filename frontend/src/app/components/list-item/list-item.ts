import { Component, computed, input } from '@angular/core';
import { MatListItem } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

type Tone = 'activity' | 'attack';

const ICONS: Record<Tone, string> = {
  attack: 'bolt',
  activity: 'cardio_load',
};

@Component({
  imports: [MatListItem, MatIcon, RouterLink],
  selector: 'app-list-item',
  styleUrl: './list-item.scss',
  templateUrl: './list-item.html',
})
export class ListItem {
  link = input.required<string | unknown[]>();
  title = input.required<string>();
  tone = input.required<Tone>();
  line = input<string>('');

  icon = computed(() => ICONS[this.tone()]);
}
