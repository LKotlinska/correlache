import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageHeader } from '../../../components/page-header/page-header';
import { ChipList } from '../../../components/chip-list/chip-list';
import { MediaTile } from '../../../components/form-fields/media-tile/media-tile';
import { ConfirmDialog, ConfirmDialogData } from '../../../components/dialog/confirm-dialog/confirm-dialog';
import { DialogService } from '../../../components/dialog/dialog.service';
import { HeadacheService } from '../../../services/headache.service';

@Component({
  imports: [DatePipe, MatCardModule, MatExpansionModule, MatIcon, MatProgressBar, ChipList, MediaTile, MatButtonModule, MatMenuModule, PageHeader, RouterLink],
  selector: 'app-headache-view',
  styleUrl: './headache-view.scss',
  templateUrl: './headache-view.html',
})
export class HeadacheView {
  private headacheService = inject(HeadacheService);
  private dialogService = inject(DialogService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  headache = rxResource({
    stream: () => this.headacheService.getHeadacheById(this.id),
  });

  confirmDelete() {
    const data: ConfirmDialogData = {
      heading: 'Delete headache?',
      message: "This can't be undone.",
      confirmLabel: 'Delete',
    };
    this.dialogService
      .open(ConfirmDialog, data)
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.delete();
      });
  }

  private delete() {
    this.headacheService.delete(this.id).subscribe({
      next: () => this.router.navigate(['/user/diary'], { replaceUrl: true }),
      error: () => this.snackBar.open("Couldn't delete this headache", 'Close', { panelClass: 'snackbar-error' }),
    });
  }
}
