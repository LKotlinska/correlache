import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutDayHeadaches } from './workout-day-headaches';
import { InsightsData } from '../../insights-data';

describe('WorkoutDayHeadaches', () => {
  let component: WorkoutDayHeadaches;
  let fixture: ComponentFixture<WorkoutDayHeadaches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutDayHeadaches],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutDayHeadaches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
