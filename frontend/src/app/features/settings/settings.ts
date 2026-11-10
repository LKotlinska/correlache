import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
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
import { MedicationService } from '../../services/medication.service';
import { Medication } from '../../models/medication.model';
import { MedicationDialog, MedicationDialogData } from '../medications/medication-dialog/medication-dialog';
import { MEDICATION_CLASS_LABELS, MEDICATION_USE_LABELS } from '../../utils/medication';

@Component({
  imports: [MatButtonModule, MatIcon, MatProgressBar],
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
  private medicationService = inject(MedicationService);

  medications = rxResource({ stream: () => this.medicationService.getMedications() });

  /** "NSAID (e.g. ibuprofen) · 400 mg · As needed". */
  medicationDetails(m: Medication): string {
    return [MEDICATION_CLASS_LABELS[m.medicationClass], m.defaultDose, MEDICATION_USE_LABELS[m.use]]
      .filter(Boolean)
      .join(' · ');
  }

  /** Opens the add (no `medication`) or edit dialog and refreshes the list after a save. */
  openMedication(medication?: Medication) {
    const data: MedicationDialogData = { medication };
    this.dialogService
      .open(MedicationDialog, data)
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.medications.reload();
      });
  }

  confirmRemoveMedication(medication: Medication) {
    const data: ConfirmDialogData = {
      heading: `Remove ${medication.name}?`,
      message: "It won't be offered when you log a dose anymore. Doses you already logged are kept.",
      confirmLabel: 'Remove',
    };
    this.dialogService
      .open(ConfirmDialog, data)
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.medicationService.deleteMedication(medication.id).subscribe({
          next: () => this.medications.reload(),
          error: (err: HttpErrorResponse) =>
            this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' }),
        });
      });
  }

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
      message: 'This permanently deletes your account and all your headaches, workouts and medications. This can\'t be undone.',
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
