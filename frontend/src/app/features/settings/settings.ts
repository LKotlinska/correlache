import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Button } from '../../components/button/button';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { getErrorMessage } from '../../utils/error-message';
import { ErrorMessage } from '../../components/error-message/error-message';
import { AccountActions } from '../../services/account-actions';
import { DialogKey, DialogService } from '../../components/dialog/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '../../components/dialog/confirm-dialog/confirm-dialog';
import { MedicationService } from '../../services/medication.service';
import { UserService } from '../../services/user.service';
import { Medication } from '../../models/medication.model';
import { MedicationDialog, MedicationDialogData } from '../medications/medication-dialog/medication-dialog';
import { MEDICATION_CLASS_LABELS, MEDICATION_USE_LABELS } from '../../utils/medication';

@Component({
  imports: [ErrorMessage, MatButtonModule, MatIcon, MatProgressBar],
  selector: 'app-settings',
  styleUrl: './settings.scss',
  templateUrl: './settings.html',
})
export class Settings {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private accountActions = inject(AccountActions);
  private dialogService = inject(DialogService);
  private medicationService = inject(MedicationService);
  private userService = inject(UserService);

  exporting = signal(false);
  loadingExample = signal(false);

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

  openDialog(key: DialogKey) {
    this.dialogService.open(key);
  }

  /** Downloads all of the user's data as a JSON file named with today's local date. */
  downloadData() {
    this.exporting.set(true);
    this.userService.exportData().subscribe({
      next: (blob) => {
        this.exporting.set(false);
        saveFile(blob, `correlache-export-${localDate(new Date())}.json`);
      },
      error: (err: HttpErrorResponse) => {
        this.exporting.set(false);
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      },
    });
  }

  /** Temporary, for public testing: replaces the user's data with a generated year once they confirm. */
  confirmLoadExampleData() {
    const data: ConfirmDialogData = {
      heading: 'Load example data?',
      message:
        "This replaces all your headaches, workouts and medications with a made-up year of example data. Anything you've logged will be deleted. This can't be undone.",
      confirmLabel: 'Replace my data',
    };
    this.dialogService
      .open(ConfirmDialog, data)
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.loadingExample.set(true);
        this.userService.loadExampleData().subscribe({
          next: () => {
            this.loadingExample.set(false);
            this.medications.reload();
            this.snackBar.open('Example data loaded', 'Close', { duration: 4000 });
          },
          error: (err: HttpErrorResponse) => {
            this.loadingExample.set(false);
            this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
          },
        });
      });
  }

  signOut() {
    this.accountActions.signOut().subscribe(() => this.router.navigate(['/']));
  }

  confirmDeleteAccount() {
    this.accountActions.confirmDeleteAccount().subscribe(() => this.router.navigate(['/']));
  }
}

/** "2026-11-10" in the user's time zone. */
function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  // Some browsers ignore clicks on links that aren't in the document
  document.body.appendChild(link);
  link.click();
  link.remove();
  // The download starts asynchronously in some browsers, so the URL must outlive the click
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
