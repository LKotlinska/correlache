import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutsVsHeadaches } from './workouts-vs-headaches';
import { InsightsData } from '../../insights-data';

describe('WorkoutsVsHeadaches', () => {
  let component: WorkoutsVsHeadaches;
  let fixture: ComponentFixture<WorkoutsVsHeadaches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutsVsHeadaches],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutsVsHeadaches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
