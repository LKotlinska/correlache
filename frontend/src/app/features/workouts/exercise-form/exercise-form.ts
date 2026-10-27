import { Component, inject } from '@angular/core';
import { PageHeader } from '../../../components/page-header/page-header';
import { WorkoutService } from '../../../services/workout.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  imports: [PageHeader, ScrollingModule, MatProgressBar],
  selector: 'app-exercise-form',
  styleUrl: './exercise-form.scss',
  templateUrl: './exercise-form.html',
})
export class ExerciseForm {
  workoutService = inject(WorkoutService);
  
  exercises = rxResource({
    stream: () => this.workoutService.getExercises(),
  });

}
