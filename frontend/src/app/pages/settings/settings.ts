import { Component, inject } from '@angular/core';
import { Button } from '../../components/button/button';
import { UserService } from '../../services/user-service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { getErrorMessage } from '../../utils/error-message';

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

  signOut() {
    this.userService.logoutUser().subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: HttpErrorResponse) => {
        // 401: user is logged out already.
        if (err.status === 401) {
          this.router.navigate(['/']);
          return;
        }
        this.snackBar.open(getErrorMessage(err), 'Close', { panelClass: 'snackbar-error' });
      },
    });
  }
}
