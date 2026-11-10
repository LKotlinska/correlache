import { Component, inject, input, TemplateRef, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Dialog } from '../../../components/dialog/dialog';

/**
 * Info button for a chart card header that opens a "How to read this chart" dialog.
 * Place it inside mat-card-header; it pushes itself to the right edge.
 */
@Component({
  imports: [Dialog, MatIcon, MatIconButton, NgTemplateOutlet],
  selector: 'app-chart-info',
  styleUrl: './chart-info.scss',
  templateUrl: './chart-info.html',
})
export class ChartInfo {
  /** The dialog body, rendered inside the dialog. */
  content = input.required<TemplateRef<unknown>>();
  heading = input('How to read this chart');

  private dialog = inject(MatDialog);
  private template = viewChild.required<TemplateRef<unknown>>('dialog');

  open(): void {
    this.dialog.open(this.template());
  }
}
