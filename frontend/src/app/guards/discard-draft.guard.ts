import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { map, of } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from '../components/dialog/confirm-dialog/confirm-dialog';
import { DialogService } from '../components/dialog/dialog.service';

export interface HasDraft {
  hasDraft(): boolean;
  discardDraft(): void;
}

/** Asks before leaving a form with an unsaved draft. Going to the exercise picker keeps the draft without asking. */
export const discardDraftGuard: CanDeactivateFn<HasDraft> = (component, _route, _state, nextState) => {
  if (!component.hasDraft() || nextState?.url.endsWith('/exercises')) {
    return true;
  }
  const data: ConfirmDialogData = {
    heading: 'Discard this draft?',
    message: 'Your progress will be lost.',
    confirmLabel: 'Discard',
  };
  return inject(DialogService)
    .open(ConfirmDialog, data)
    .afterClosed()
    .pipe(
      map((confirmed) => {
        if (confirmed) component.discardDraft();
        return !!confirmed;
      }),
    );
};
