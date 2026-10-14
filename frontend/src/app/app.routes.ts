import { Routes } from '@angular/router';
import { Landingpage } from './landingpage/landingpage';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
    {
        path: '',
        component: Landingpage,
    },
    {
        path: 'dashboard',
        component: Dashboard,
    },
];
