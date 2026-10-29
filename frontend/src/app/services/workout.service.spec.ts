import { TestBed } from '@angular/core/testing';
import { WorkoutService } from './workout.service';

describe('Workout', () => {
  let service: WorkoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
