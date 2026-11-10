import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutTypeHeadaches } from './workout-type-headaches';
import { InsightsData } from '../../insights-data';

describe('WorkoutTypeHeadaches', () => {
  let component: WorkoutTypeHeadaches;
  let fixture: ComponentFixture<WorkoutTypeHeadaches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutTypeHeadaches],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutTypeHeadaches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
