import { Component, inject, input, TemplateRef, viewChild } from '@angular/core';
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
  heading = input('How to read this chart');
  icon = input('info');
  label = input('How to read this');
  /** Class added to the dialog's overlay pane, for global styling of a specific dialog. */
  panelClass = input<string>();

  private dialog = inject(MatDialog);
  private template = viewChild.required<TemplateRef<unknown>>('dialog');

  open(): void {
    this.dialog.open(this.template(), { panelClass: this.panelClass() });
  }
}
