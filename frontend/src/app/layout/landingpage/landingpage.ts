import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogKey, DialogService } from '../../components/dialog/dialog.service';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [MatButtonModule, MatDialogModule, MatIcon],
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
