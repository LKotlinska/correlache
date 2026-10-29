import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutView } from './workout-view';

describe('WorkoutView', () => {
  let component: WorkoutView;
  let fixture: ComponentFixture<WorkoutView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutView],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
