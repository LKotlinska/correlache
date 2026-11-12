import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogKey, DialogService } from '../../components/dialog/dialog.service';
import { LoginData } from '../../components/dialog/login/login';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [MatButtonModule, MatDialogModule, MatIcon],
  selector: 'app-landingpage',
  styleUrl: './landingpage.scss',
  templateUrl: './landingpage.html',
})
export class Landingpage {
  private dialogService = inject(DialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    // authGuard sends signed-out visitors of /user/... here with ?signIn=required
    if (this.route.snapshot.queryParamMap.get('signIn') === 'required') {
      const data: LoginData = { notice: 'Please sign in to continue.' };
      this.dialogService.open('login', data);
      // Drop the flag so a refresh or Back doesn't reopen the dialog
      this.router.navigate([], { queryParams: { signIn: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  openDialog(key: DialogKey) {
    this.dialogService.open(key);
  }
}
