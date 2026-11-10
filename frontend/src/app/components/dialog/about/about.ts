import { Component, inject } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { Dialog } from '../dialog';
import { DialogService } from '../dialog.service';

@Component({
  imports: [MatDialogModule, Dialog, MatButton],
  selector: 'app-about',
  styleUrl: './about.scss',
  templateUrl: './about.html',
})
export class About {
  private dialogService = inject(DialogService);

  /** Opens on top of About, so closing the policy comes back here. */
  openPrivacy() {
    this.dialogService.open('privacy');
  }
}
