import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SignupDialog } from './signup/signup-dialog';

@Component({
  imports: [MatButtonModule, MatDialogModule],
  selector: 'app-dialog',
  styleUrl: './dialog.scss',
  templateUrl: './dialog.html',
})
export class Dialog {
  readonly dialog = inject(MatDialog);

  openDialog() {
    const dialogRef = this.dialog.open(SignupDialog);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
