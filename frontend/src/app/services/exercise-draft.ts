import { Service, signal } from '@angular/core';
import { Exercise } from '../models/workout.model';

@Service()
export class ExerciseDraftService {
    readonly exercises = signal<Exercise[]>([]);
}
