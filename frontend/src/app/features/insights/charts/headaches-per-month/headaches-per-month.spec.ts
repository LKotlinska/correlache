import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeadachesPerMonth } from './headaches-per-month';
import { InsightsData } from '../../insights-data';

describe('HeadachesPerMonth', () => {
  let component: HeadachesPerMonth;
  let fixture: ComponentFixture<HeadachesPerMonth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadachesPerMonth],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadachesPerMonth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
