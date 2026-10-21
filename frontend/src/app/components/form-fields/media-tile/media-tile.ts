import { Component, input, model } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-media-tile',
  styleUrl: './media-tile.scss',
  templateUrl: './media-tile.html',
})
export class MediaTile {
  image = input.required<string>();
  altText = input.required<string>();
  title = input.required<string>();
  subtitle = input<string>();

  checked = model(false);

  toggle(event: Event) {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
