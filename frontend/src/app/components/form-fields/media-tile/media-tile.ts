import { Component, inject, input, model, TemplateRef, viewChild } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Dialog } from '../../dialog/dialog';

@Component({
  imports: [Dialog, MatIcon, MatIconButton],
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

  private dialog = inject(MatDialog);
  private animationDialog = viewChild.required<TemplateRef<unknown>>('animationDialog');

  openAnimation() {
    this.dialog.open(this.animationDialog());
  }

  toggle(event: Event) {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
