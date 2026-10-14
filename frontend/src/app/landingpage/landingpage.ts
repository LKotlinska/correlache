import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogKey, DialogService } from '../components/dialog/dialog.service';

@Component({
  imports: [MatButtonModule, MatDialogModule],
  selector: 'app-landingpage',
  styleUrl: './landingpage.scss',
  templateUrl: './landingpage.html',
})
export class Landingpage {
  private dialogService = inject(DialogService);

  openDialog(key: DialogKey) {
    this.dialogService.open(key);
  }
}
