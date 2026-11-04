import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutsPerWeek } from './workouts-per-week';
import { InsightsData } from '../../insights-data';

describe('WorkoutsPerWeek', () => {
  let component: WorkoutsPerWeek;
  let fixture: ComponentFixture<WorkoutsPerWeek>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutsPerWeek],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutsPerWeek);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
