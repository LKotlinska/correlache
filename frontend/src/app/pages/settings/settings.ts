import { Component, inject } from '@angular/core';
import { Button } from '../../components/button/button';
import { UserService } from '../../services/user-service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [Button],
  selector: 'app-settings',
  styleUrl: './settings.scss',
  templateUrl: './settings.html',
})
export class Settings {
  private userService = inject(UserService)
  private router = inject(Router)
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
        const msg = err.error?.message;
        const text = Array.isArray(msg)
          ? msg.join('. ')
          : (msg ?? 'Something went wrong. Please try again.');
        this.snackBar.open(text, 'Close', { panelClass: 'snackbar-error' });
      },
    });
}
}
