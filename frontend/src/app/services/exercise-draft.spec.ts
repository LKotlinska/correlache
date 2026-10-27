import { TestBed } from '@angular/core/testing';
import { ExerciseDraft } from './exercise-draft';

describe('ExerciseDraft', () => {
  let service: ExerciseDraft;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExerciseDraft);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
