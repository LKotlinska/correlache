import { Component, inject } from '@angular/core';
import { Button } from '../../components/button/button';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { getErrorMessage } from '../../utils/error-message';
import { DraftStorage, HEADACHE_DRAFT_KEY } from '../../services/draft-storage';
import { ExerciseDraftService } from '../../services/exercise-draft';
import { DialogKey, DialogService } from '../../components/dialog/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '../../components/dialog/confirm-dialog/confirm-dialog';

@Component({
  imports: [],
  selector: 'app-settings',
  styleUrl: './settings.scss',
  templateUrl: './settings.html',
})
export class Settings {
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private draftStorage = inject(DraftStorage);
  private workoutDraft = inject(ExerciseDraftService);
  private dialogService = inject(DialogService);

  /** Drafts live in sessionStorage, so without this the next person in this tab would see them. */
  private clearDrafts() {
    this.draftStorage.clear(HEADACHE_DRAFT_KEY);
    this.workoutDraft.clear();
  }

  openDialog(key: DialogKey) {
    this.dialogService.open(key, { standalone: true });
  }

  signOut() {
    this.userService.logoutUser().subscribe({
      next: () => {
        this.clearDrafts();
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        // 401: user is logged out already.
        if (err.status === 401) {
          this.clearDrafts();
          this.router.navigate(['/']);
          return;
        }
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      },
    });
  }

  confirmDeleteAccount() {
    const data: ConfirmDialogData = {
      heading: 'Delete account?',
      message: 'This permanently deletes your account and all your headaches and workouts. This can\'t be undone.',
      confirmLabel: 'Delete',
    };
    this.dialogService
      .open(ConfirmDialog, data)
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.deleteAccount();
      });
  }

  private deleteAccount() {
    this.userService.deleteAccount().subscribe({
      next: () => {
        this.clearDrafts();
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' }),
    });
  }
}
