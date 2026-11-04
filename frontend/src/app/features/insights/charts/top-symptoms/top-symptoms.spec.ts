import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopSymptoms } from './top-symptoms';
import { InsightsData } from '../../insights-data';

describe('TopSymptoms', () => {
  let component: TopSymptoms;
  let fixture: ComponentFixture<TopSymptoms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopSymptoms],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(TopSymptoms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
