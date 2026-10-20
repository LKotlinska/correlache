import { inject, Service, Type } from "@angular/core";
import { SignupForm } from "./signup/signup-form";
import { SigninForm } from "./signin-form/signin-form";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { OptionPicker } from "../chip-list/option-picker/option-picker";

export type DialogKey ='signup' | 'signin';

const DialogComponents: Record<DialogKey, Type<unknown>> = {
  signup: SignupForm,
  signin: SigninForm,
};

@Service()
export class DialogService {
  readonly dialog = inject(MatDialog);

  // Opens either a component with data, or key from DialogComponents (used in switch())
  open<D>(target: DialogKey | Type<unknown>, data?: D) {
    const component = typeof target === 'string' ? DialogComponents[target] : target;
    return this.dialog.open(component, { data });
  }

  switch(dialogRef: MatDialogRef<unknown>, key: DialogKey): void {
    dialogRef.afterClosed().subscribe(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      this.open(key);
    });
    dialogRef.close();
  }
}