import { Component, inject } from '@angular/core';
import { HeadacheService } from '../../services/headache.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ListItem } from '../../components/list-item/list-item';
import { WorkoutService } from '../../services/workout.service';

@Component({
  imports: [ListItem],
  selector: 'app-diary',
  styleUrl: './diary.scss',
  templateUrl: './diary.html',
})
export class Diary {
  private headacheService = inject(HeadacheService);
  private workoutService = inject(WorkoutService);

  headaches = rxResource({
    stream: () => this.headacheService.getHeadaches(),
  });

  workouts = rxResource({
    stream: () => this.workoutService.getWorkouts(),
  })
}
