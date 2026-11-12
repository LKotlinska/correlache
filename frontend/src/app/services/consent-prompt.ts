import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize, map, Observable, shareReplay } from 'rxjs';
import { Consent, ConsentResult } from '../components/dialog/consent/consent';

/** Opens the consent dialog at most once at a time; callers while it is open share its answer. */
@Service()
export class ConsentPrompt {
  private dialog = inject(MatDialog);
  private pending: Observable<boolean> | null = null;

  /** Emits true when the user gave consent, false when they signed out or deleted their account. */
  ask(): Observable<boolean> {
    this.pending ??= this.dialog
      .open<Consent, unknown, ConsentResult>(Consent, {
        disableClose: true,
        // Stay open on Back/forward: closing would count as declining while the user is still signed in
        closeOnNavigation: false,
      })
      .afterClosed()
      .pipe(
        map((result) => result === 'consented'),
        finalize(() => (this.pending = null)),
        shareReplay(1),
      );
    return this.pending;
  }
}
