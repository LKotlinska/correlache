import { Component, inject, input } from '@angular/core';
import { Observable } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeader } from '../page-header/page-header';
import { ConfirmDialog, ConfirmDialogData } from '../dialog/confirm-dialog/confirm-dialog';
import { DialogService } from '../dialog/dialog.service';

/** Page header for a single entry (headache, workout) with an optional edit/delete menu. */
@Component({
  imports: [MatButtonModule, MatIcon, MatMenuModule, RouterLink, PageHeader],
  selector: 'app-detail-header',
  templateUrl: './detail-header.html',
})
export class DetailHeader {
  private dialogService = inject(DialogService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  title = input.required<string>();
  /** Lower-case name used in the dialog and error texts, e.g. "headache". */
  entityName = input.required<string>();
  /** Shows the Edit menu item when set. */
  editLink = input<unknown[]>();
  /** Shows the Delete menu item when set. Called after the user confirms. */
  deleteFn = input<() => Observable<unknown>>();

  confirmDelete() {
    const data: ConfirmDialogData = {
      heading: `Delete ${this.entityName()}?`,
      message: "This can't be undone.",
      confirmLabel: 'Delete',
    };
    this.dialogService
      .open(ConfirmDialog, data)
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.delete();
      });
  }

  private delete() {
    this.deleteFn()?.().subscribe({
      next: () => this.router.navigate(['/user/diary'], { replaceUrl: true }),
      error: () =>
        this.snackBar.open(`Couldn't delete this ${this.entityName()}`, 'Close', {
          panelClass: 'snackbar-error',
        }),
    });
  }
}
