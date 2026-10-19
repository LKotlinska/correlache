import { Routes } from '@angular/router';
import { Landingpage } from './layout/landingpage/landingpage';
import { Dashboard } from './layout/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { NotFoundError } from 'rxjs';
import { Headaches } from './features/headaches/headaches';
import { HeadacheForm } from './features/headaches/headache-form/headache-form';

export const routes: Routes = [
    {
        path: '',
        component: Landingpage,
    },
    {
        path: 'user',
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            {
                path: '',
                component: Dashboard,
                children: [
                    { path: '', redirectTo: 'diary', pathMatch: 'full' },
                    // Lazy loading keeps the bundle small
                    { path: 'diary', loadComponent: () => import('./features/diary/diary').then(m => m.Diary)},
                    { path: 'insights', loadComponent: () => import('./features/insights/insights').then(m => m.Insights)},
                    { path: 'settings', loadComponent: () => import('./features/settings/settings').then(m => m.Settings)},
                ]
            },
            {
                path: 'headache',
                component: Headaches,
                children: [
                    { path: 'add', component: HeadacheForm},
                    // { path: 'view'},
                    // { path: 'edit'},
                ]
            }
        ]
    },
];
