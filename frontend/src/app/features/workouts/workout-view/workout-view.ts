import { Component, inject } from '@angular/core';
import { DetailHeader } from '../../../components/detail-header/detail-header';
import { ActivatedRoute } from '@angular/router';
import { WorkoutService } from '../../../services/workout.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { WorkoutDetail, WorkoutExerciseDetail } from '../../../models/workout.model';
import { LookupOption } from '../../../models/headache.model';
import { ChipList } from '../../../components/chip-list/chip-list';
import { DurationPipe } from '../../../pipes/duration.pipe';

@Component({
  imports: [DatePipe, DurationPipe, DetailHeader, ChipList, MatProgressBar, MatCard, MatCardContent, MatExpansionModule, MatIcon],
  selector: 'app-workout-view',
  styleUrl: './workout-view.scss',
  templateUrl: './workout-view.html',
})
export class WorkoutView {
  private workoutService = inject(WorkoutService);
  id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  workout = rxResource({
    stream: () => this.workoutService.getWorkoutById(this.id)
  })

  /** Muscle groups the workout mainly trained, in library order, without duplicates. */
  muscleGroups(workout: WorkoutDetail): LookupOption[] {
    const groups = new Map<number, LookupOption>();
    for (const exercise of workout.exercises) {
      for (const muscle of exercise.muscles) {
        if (muscle.role === 'primary') groups.set(muscle.muscleGroup.id, muscle.muscleGroup);
      }
    }
    return [...groups.values()].sort((a, b) => a.id - b.id);
  }
}
