import { TestBed } from '@angular/core/testing';
import { ExerciseDraftService } from './exercise-draft';

describe('ExerciseDraftService', () => {
  let service: ExerciseDraftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExerciseDraftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
