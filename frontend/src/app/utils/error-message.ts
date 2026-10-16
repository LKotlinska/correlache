import { HttpErrorResponse } from '@angular/common/http';

const FALLBACK = 'Something went wrong. Please try again.';

export function getErrorMessage(err: HttpErrorResponse): string {
  const msg = err.error?.message;
  return Array.isArray(msg) ? msg.join('. ') : (msg ?? FALLBACK);
}
