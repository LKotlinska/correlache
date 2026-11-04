import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseProgress } from './exercise-progress';

describe('ExerciseProgress', () => {
  let component: ExerciseProgress;
  let fixture: ComponentFixture<ExerciseProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseProgress],
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseProgress);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
