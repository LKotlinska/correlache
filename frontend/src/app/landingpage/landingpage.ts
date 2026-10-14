import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SignupForm } from '../components/dialog/signup/signup-form';
import { SigninForm } from '../components/dialog/signin-form/signin-form';

const DialogComponents = {
  signup: SignupForm,
  signin: SigninForm,
};

@Component({
  imports: [MatButtonModule, MatDialogModule],
  selector: 'app-landingpage',
  styleUrl: './landingpage.scss',
  templateUrl: './landingpage.html',
})
export class Landingpage {
  readonly dialog = inject(MatDialog);

  openDialog(key: keyof typeof DialogComponents) {
    const dialogRef = this.dialog.open(DialogComponents[key]);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
