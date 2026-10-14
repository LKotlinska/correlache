import { inject, Service, Type } from "@angular/core";
import { SignupForm } from "./signup/signup-form";
import { SigninForm } from "./signin-form/signin-form";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DIALOG_SCROLL_STRATEGY } from "@angular/cdk/dialog";

export type DialogKey ='signup' | 'signin';

const DialogComponents: Record<DialogKey, Type<unknown>> = {
  signup: SignupForm,
  signin: SigninForm,
};

@Service()
export class DialogService {
  readonly dialog = inject(MatDialog);

  open(key: DialogKey): MatDialogRef<unknown> {
    return this.dialog.open(DialogComponents[key]);
  }
  switch(dialogRef: MatDialogRef<unknown>, key: DialogKey): void {
    dialogRef.afterClosed().subscribe(() => {
        (document.activeElement as HTMLElement | null)?.blur(); // removes keyboard focus from the current element
        this.open(key);
    })
    dialogRef.close();
  }
}