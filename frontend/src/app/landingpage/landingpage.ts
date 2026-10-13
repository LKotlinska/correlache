import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SignupDialog } from '../components/dialog/signup/signup-dialog';

@Component({
  imports: [MatButtonModule, MatDialogModule],
  selector: 'app-landingpage',
  styleUrl: './landingpage.scss',
  templateUrl: './landingpage.html',
})
export class Landingpage {
  readonly dialog = inject(MatDialog);

  openDialog() {
    const dialogRef = this.dialog.open(SignupDialog);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
