import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { catchError, map, of } from 'rxjs';
import { UserService } from '../../services/user.service';

/** Shown for any URL no route matches, e.g. an old or mistyped link. */
@Component({
  imports: [RouterLink, MatButton, MatIcon],
  selector: 'app-not-found',
  styleUrl: './not-found.scss',
  templateUrl: './not-found.html',
})
export class NotFound {
  private userService = inject(UserService);

  /** Whether someone is signed in, so the way back leads to their diary rather than the start page. */
  protected readonly signedIn = rxResource({
    stream: () =>
      this.userService.me().pipe(
        map(() => true),
        catchError(() => of(false)),
      ),
  });
}
