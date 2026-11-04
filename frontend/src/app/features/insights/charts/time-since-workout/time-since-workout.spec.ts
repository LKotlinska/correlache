import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeSinceWorkout } from './time-since-workout';
import { InsightsData } from '../../insights-data';

describe('TimeSinceWorkout', () => {
  let component: TimeSinceWorkout;
  let fixture: ComponentFixture<TimeSinceWorkout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSinceWorkout],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSinceWorkout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
