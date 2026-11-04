import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PainOverTime } from './pain-over-time';
import { InsightsData } from '../../insights-data';

describe('PainOverTime', () => {
  let component: PainOverTime;
  let fixture: ComponentFixture<PainOverTime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainOverTime],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(PainOverTime);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
