import { booleanAttribute, Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Button } from '../button/button';

/**
 * A failed load: the message, and a "Try again" button when `retryable` is set.
 * Centred block by default; `compact` makes it a single line for use inside cards.
 *
 * `<app-error-message message="Couldn't load your diary." retryable (retry)="reload()" />`
 */
@Component({
  imports: [Button, MatIcon],
  host: { '[class.compact]': 'compact()' },
  selector: 'app-error-message',
  styleUrl: './error-message.scss',
  templateUrl: './error-message.html',
})
export class ErrorMessage {
  message = input.required<string>();
  retryable = input(false, { transform: booleanAttribute });
  /** Stretches the button to the full width, for errors at the end of a list. */
  isFullWidth = input(false, { transform: booleanAttribute });
  /** One line with a small icon, for inside cards. */
  compact = input(false, { transform: booleanAttribute });
  retry = output<void>();
}
