import { Component, input, model } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { InfoButton } from '../../info-button/info-button';

@Component({
  imports: [InfoButton, MatIcon],
  selector: 'app-media-tile',
  styleUrl: './media-tile.scss',
  templateUrl: './media-tile.html',
})
export class MediaTile {
  /** Image URL; null shows a placeholder icon instead. */
  image = input.required<string | null>();
  altText = input.required<string>();
  title = input.required<string>();
  subtitle = input<string>();
  /** Animated image URL; when set, a help button opens it in a dialog. */
  animation = input<string | null>(null);

  /** Display-only: the tile can't be toggled. */
  readonly = input(false);

  checked = model(false);

  toggle(event: Event) {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
