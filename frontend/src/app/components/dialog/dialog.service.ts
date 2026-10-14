import { inject, Service, Type } from "@angular/core";
import { SignupForm } from "./signup/signup-form";
import { SigninForm } from "./signin-form/signin-form";
import { MatDialog } from "@angular/material/dialog";

export type DialogKey ='signup' | 'signin';

const DialogComponents: Record<DialogKey, Type<unknown>> = {
  signup: SignupForm,
  signin: SigninForm,
};

@Service()
export class DialogService {
  readonly dialog = inject(MatDialog);

  open(key: DialogKey) {
    return this.dialog.open(DialogComponents[key]);
  }
}