import { booleanAttribute, Component, inject, input, TemplateRef, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Dialog } from '../dialog/dialog';

/**
 * Icon button that opens a dialog showing the given template.
 * Inside a mat-card-header it pushes itself to the right edge.
 */
@Component({
  imports: [Dialog, MatIcon, MatIconButton, NgTemplateOutlet],
  selector: 'app-info-button',
  styleUrl: './info-button.scss',
  templateUrl: './info-button.html',
})
export class InfoButton {
  /** The dialog body, rendered inside the dialog. */
  content = input.required<TemplateRef<unknown>>();
  heading = input.required<string>();
  /** Accessible name of the button; it shows only an icon. */
  label = input.required<string>();
  icon = input('info');
  /** Smaller dialog heading, for long names. */
  compactHeading = input(false, { transform: booleanAttribute });

  private dialog = inject(MatDialog);
  private template = viewChild.required<TemplateRef<unknown>>('dialog');

  open(): void {
    this.dialog.open(this.template());
  }
}
