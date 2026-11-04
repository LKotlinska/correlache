import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeadachesByWeekday } from './headaches-by-weekday';
import { InsightsData } from '../../insights-data';

describe('HeadachesByWeekday', () => {
  let component: HeadachesByWeekday;
  let fixture: ComponentFixture<HeadachesByWeekday>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadachesByWeekday],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadachesByWeekday);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
