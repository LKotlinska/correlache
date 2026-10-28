import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateWorkoutPayload, Exercise, Workout, WorkoutDetail } from '../models/workout.model';

@Service()
export class WorkoutService {
    private http = inject(HttpClient)

    getExercises(): Observable<Exercise[]> {
        return this.http.get<Exercise[]>('/api/workout/exercises');
    }

    create(payload: CreateWorkoutPayload) {
        return this.http.post('/api/workout', payload);
    }

    update(id: string, payload: CreateWorkoutPayload) {
        return this.http.put(`/api/workout/${id}`, payload);
    }

    delete(id: string) {
        return this.http.delete<void>(`/api/workout/${id}`);
    }

    getWorkouts(): Observable<Workout[]> {
        return this.http.get<Workout[]>('/api/workout');
    }

    getWorkoutById(id: string): Observable<WorkoutDetail> {
        return this.http.get<WorkoutDetail>(`/api/workout/${id}`)
    }
}
