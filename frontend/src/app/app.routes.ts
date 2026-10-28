import { Routes } from '@angular/router';
import { Landingpage } from './layout/landingpage/landingpage';
import { Dashboard } from './layout/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { NotFoundError } from 'rxjs';
import { Headaches } from './features/headaches/headaches';
import { Workouts } from './features/workouts/workouts';
import { discardDraftGuard } from './guards/discard-draft.guard';

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
                    { path: 'add', canDeactivate: [discardDraftGuard], loadComponent: () => import('./features/headaches/headache-form/headache-form').then(m => m.HeadacheForm)},
                    { path: ':id/edit', loadComponent: () => import('./features/headaches/headache-form/headache-form').then(m => m.HeadacheForm)},
                    { path: ':id', loadComponent: () => import('./features/headaches/headache-view/headache-view').then(m => m.HeadacheView)},
                ]
            },
            {
                path: 'workout',
                component: Workouts,
                children: [
                    { path: 'add', canDeactivate: [discardDraftGuard], loadComponent: () => import('./features/workouts/workout-form/workout-form').then(m => m.WorkoutForm)},
                    { path: 'add/exercises', loadComponent: () => import('./features/workouts/exercise-form/exercise-form').then(m => m.ExerciseForm)},
                    { path: ':id/edit', loadComponent: () => import('./features/workouts/workout-form/workout-form').then(m => m.WorkoutForm)},
                    { path: ':id/edit/exercises', loadComponent: () => import('./features/workouts/exercise-form/exercise-form').then(m => m.ExerciseForm)},
                    { path: ':id', loadComponent: () => import('./features/workouts/workout-view/workout-view').then(m => m.WorkoutView)},
                ]
            }
        ]
    },
];
