import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, first } from 'rxjs';
import { DialogKey, DialogService } from '../../components/dialog/dialog.service';
import { SIGN_IN_PARAM, SIGN_IN_REQUIRED } from '../../guards/sign-in-redirect';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [MatButtonModule, MatDialogModule, MatIcon],
  selector: 'app-landingpage',
  styleUrl: './landingpage.scss',
  templateUrl: './landingpage.html',
})
export class Landingpage {
  private dialogService = inject(DialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    // An observable, not the snapshot: when authGuard redirects here while the landing page
    // is already showing (e.g. Back after signing out), the router reuses this instance.
    this.route.queryParamMap
      .pipe(
        filter((params) => params.get(SIGN_IN_PARAM) === SIGN_IN_REQUIRED),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.dialogService.open('login', { notice: 'Please sign in to continue.' });
        this.clearSignInFlag();
      });
  }

  openDialog(key: DialogKey) {
    this.dialogService.open(key);
  }

  /** Drops the flag so a refresh or Back doesn't reopen the dialog. */
  private clearSignInFlag() {
    // Wait for the redirect navigation to finish, so this one doesn't start in the middle of it
    this.router.events.pipe(first((e) => e instanceof NavigationEnd)).subscribe(() =>
      this.router.navigate([], {
        queryParams: { [SIGN_IN_PARAM]: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  }
}
