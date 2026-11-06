import { inject, Service, Type } from "@angular/core";
import { Register } from "./register/register";
import { Login } from "./login/login";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { PrivacyPolicy } from "./privacy-policy/privacy-policy";
import { Terms } from "./terms/terms";

export type DialogKey ='register' | 'login' | 'privacy' | 'terms';

const DialogComponents: Record<DialogKey, Type<unknown>> = {
  register: Register,
  login: Login,
  privacy: PrivacyPolicy,
  terms: Terms,
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