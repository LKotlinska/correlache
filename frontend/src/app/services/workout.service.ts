import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Exercise } from '../models/workout.model';

@Service()
export class WorkoutService {
    private http = inject(HttpClient)

    getExercises(): Observable<Exercise[]> {
        return this.http.get<Exercise[]>('/api/workout/exercises');
    }
}
