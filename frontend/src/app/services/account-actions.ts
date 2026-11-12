import { HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, EMPTY, filter, map, Observable, of, switchMap } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from '../components/dialog/confirm-dialog/confirm-dialog';
import { DialogService } from '../components/dialog/dialog.service';
import { getErrorMessage } from '../utils/error-message';
import { DraftStorage, HEADACHE_DRAFT_KEY } from './draft-storage';
import { ExerciseDraftService } from './exercise-draft';
import { UserService } from './user.service';

/** Sign out and account deletion, shared by Settings and the consent prompt. Callers decide where to go next. */
@Service()
export class AccountActions {
  private userService = inject(UserService);
  private dialogService = inject(DialogService);
  private snackBar = inject(MatSnackBar);
  private draftStorage = inject(DraftStorage);
  private workoutDraft = inject(ExerciseDraftService);

  /** Emits once the session is gone (a 401 means it already was). Other errors show a snackbar and emit nothing. */
  signOut(): Observable<void> {
    return this.userService.logoutUser().pipe(
      catchError((err: HttpErrorResponse) => (err.status === 401 ? of(null) : this.fail(err))),
      map(() => this.clearDrafts()),
    );
  }

  /** Asks for confirmation, then deletes the account. Emits once it is deleted; nothing when cancelled or failed. */
  confirmDeleteAccount(): Observable<void> {
    const data: ConfirmDialogData = {
      heading: 'Delete account?',
      message: "This permanently deletes your account and all your headaches, workouts and medications. This can't be undone.",
      confirmLabel: 'Delete',
    };
    return this.dialogService
      .open(ConfirmDialog, data)
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.userService.deleteAccount().pipe(catchError((err: HttpErrorResponse) => this.fail(err)))),
        map(() => this.clearDrafts()),
      );
  }

  /** Drafts live in sessionStorage, so without this the next person in this tab would see them. */
  private clearDrafts() {
    this.draftStorage.clear(HEADACHE_DRAFT_KEY);
    this.workoutDraft.clear();
  }

  private fail(err: HttpErrorResponse) {
    this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
    return EMPTY;
  }
}
