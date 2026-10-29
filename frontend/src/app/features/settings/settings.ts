import { Component, inject } from '@angular/core';
import { Button } from '../../components/button/button';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { getErrorMessage } from '../../utils/error-message';
import { DraftStorage, HEADACHE_DRAFT_KEY } from '../../services/draft-storage';
import { ExerciseDraftService } from '../../services/exercise-draft';

@Component({
  imports: [Button],
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

  /** Drafts live in sessionStorage, so without this the next person in this tab would see them. */
  private clearDrafts() {
    this.draftStorage.clear(HEADACHE_DRAFT_KEY);
    this.workoutDraft.clear();
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
}
