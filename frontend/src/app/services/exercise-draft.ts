import { Service, signal } from '@angular/core';

@Service()
export class ExerciseDraftService {
    readonly exerciseIds = signal<number[]>([]);
}
