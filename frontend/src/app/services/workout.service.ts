import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateWorkoutPayload,
  Exercise,
  ImportWorkoutsResult,
  Workout,
  WorkoutDetail,
} from '../models/workout.model';
import { dateRangeParams } from '../utils/date';

@Service()
export class WorkoutService {
  private http = inject(HttpClient);

  getExercises(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>('/api/workout/exercises');
  }

  create(payload: CreateWorkoutPayload) {
    return this.http.post<Workout>('/api/workout', payload);
  }

  /** Saves a batch of imported workouts, at most IMPORT_BATCH_SIZE. Ones already saved are skipped. */
  importWorkouts(workouts: CreateWorkoutPayload[]) {
    return this.http.post<ImportWorkoutsResult>('/api/workout/import', { workouts });
  }

  update(id: string, payload: CreateWorkoutPayload) {
    return this.http.put<Workout>(`/api/workout/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<void>(`/api/workout/${id}`);
  }

  /** Workouts newest first, optionally only those started from `from` (inclusive) until `to` (exclusive), and at most `limit`. */
  getWorkouts(range: { from?: Date; to?: Date; limit?: number } = {}): Observable<Workout[]> {
    return this.http.get<Workout[]>('/api/workout', { params: dateRangeParams(range) });
  }

  getWorkoutById(id: string): Observable<WorkoutDetail> {
    return this.http.get<WorkoutDetail>(`/api/workout/${id}`);
  }
}
