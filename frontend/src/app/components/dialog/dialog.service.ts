import { inject, Service, Type } from "@angular/core";
import { Register } from "./register/register";
import { Login, LoginData } from "./login/login";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { PrivacyPolicy } from "./privacy-policy/privacy-policy";
import { Terms } from "./terms/terms";
import { About } from "./about/about";

export type DialogKey ='register' | 'login' | 'privacy' | 'terms' | 'about';

const DialogComponents: Record<DialogKey, Type<unknown>> = {
  register: Register,
  login: Login,
  privacy: PrivacyPolicy,
  terms: Terms,
  about: About,
};

@Service()
export class DialogService {
  readonly dialog = inject(MatDialog);

  // Opens either a component with data, or key from DialogComponents (used in switch()).
  // Keyed dialogs that take data get their own overload so the data is type-checked.
  open(target: 'login', data?: LoginData): MatDialogRef<unknown>;
  open(target: DialogKey): MatDialogRef<unknown>;
  open<D>(target: Type<unknown>, data?: D): MatDialogRef<unknown>;
  open(target: DialogKey | Type<unknown>, data?: unknown) {
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