import { Routes } from '@angular/router';
import { Landingpage } from './pages/landingpage/landingpage';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { NotFoundError } from 'rxjs';

export const routes: Routes = [
    {
        path: '',
        component: Landingpage,
    },
    {
        path: 'user',
        component: Dashboard,
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            { path: '', redirectTo: 'diary', pathMatch: 'full' },
            {
                path: 'diary',
                // Lazy loading keeps the bundle small
                loadComponent: () => import('./pages/diary/diary').then(m => m.Diary),
            },
            {
                path: 'insights',
                loadComponent: () => import('./pages/insights/insights').then(m => m.Insights),
            },
            {
                path: 'settings',
                loadComponent: () => import('./pages/settings/settings').then(m => m.Settings),
            }
        ]
    },
];
