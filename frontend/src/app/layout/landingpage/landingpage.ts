import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, first } from 'rxjs';
import { DialogKey, DialogService } from '../../components/dialog/dialog.service';
import { SIGN_IN_PARAM, SIGN_IN_REQUIRED } from '../../guards/sign-in-redirect';
import { MatIcon } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { baseChartOptions, CHART_COLOR, CHART_COLOR_SECONDARY } from '../../features/insights/chart-defaults';

@Component({
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIcon,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    BaseChartDirective,
  ],
  selector: 'app-landingpage',
  styleUrl: './landingpage.scss',
  templateUrl: './landingpage.html',
})
export class Landingpage {
  /** Example weeks for the "Workouts vs headaches" preview, drawn like the insights chart so it follows the colour scheme. */
  previewData: ChartData<'bar' | 'line'> = {
    labels: ['21 Sept', '28 Sept', '5 Oct', '12 Oct', '19 Oct', '26 Oct', '2 Nov', '9 Nov'],
    datasets: [
      {
        type: 'bar',
        label: 'Workouts',
        data: [4, 6, 3, 2, 3, 2, 3, 1],
        backgroundColor: CHART_COLOR,
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'line',
        label: 'Headaches',
        data: [1, 2, 2, 1, 2, 0, 0, 1],
        borderColor: CHART_COLOR_SECONDARY,
        backgroundColor: CHART_COLOR_SECONDARY,
        pointRadius: 4,
        tension: 0.3,
        order: 1,
      },
    ],
  };

  /** Same axes and legend as the insights chart, but static: it's an illustration, not data to inspect. */
  previewOptions: ChartOptions<'bar' | 'line'> = {
    ...baseChartOptions,
    events: [],
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
    },
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: true, position: 'bottom', labels: { usePointStyle: true } },
    },
  };

  private dialogService = inject(DialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    // An observable, not the snapshot: when authGuard redirects here while the landing page
    // is already showing (e.g. Back after signing out), the router reuses this instance.
    this.route.queryParamMap
      .pipe(
        filter((params) => params.get(SIGN_IN_PARAM) === SIGN_IN_REQUIRED),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.dialogService.open('login', { notice: 'Please sign in to continue.' });
        this.clearSignInFlag();
      });
  }

  /** Closes the menu first (when opened from it), so the dialog takes focus over it. */
  openDialog(key: DialogKey, menu?: MatSidenav) {
    menu?.close();
    this.dialogService.open(key);
  }

  scrollTo(section: HTMLElement, menu?: MatSidenav) {
    menu?.close();
    section.scrollIntoView({ behavior: 'smooth' });
  }

  /** Drops the flag so a refresh or Back doesn't reopen the dialog. */
  private clearSignInFlag() {
    // Wait for the redirect navigation to finish, so this one doesn't start in the middle of it
    this.router.events.pipe(first((e) => e instanceof NavigationEnd)).subscribe(() =>
      this.router.navigate([], {
        queryParams: { [SIGN_IN_PARAM]: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  }
}
