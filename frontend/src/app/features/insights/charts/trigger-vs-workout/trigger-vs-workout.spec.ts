import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TriggerVsWorkout } from './trigger-vs-workout';
import { InsightsData } from '../../insights-data';

describe('TriggerVsWorkout', () => {
  let component: TriggerVsWorkout;
  let fixture: ComponentFixture<TriggerVsWorkout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriggerVsWorkout],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(TriggerVsWorkout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
