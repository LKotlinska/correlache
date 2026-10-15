import { Routes } from '@angular/router';
import { Landingpage } from './pages/landingpage/landingpage';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { Diary } from './pages/diary/diary';
import { Insights } from './pages/insights/insights';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
    {
        path: '',
        component: Landingpage,
    },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [authGuard],
        children: [
            {
                path: 'diary',
                component: Diary,
            },
            {
                path: 'insights',
                component: Insights,
            },
            {
                path: 'settings',
                component: Settings,
            }
        ]
    },
];
