import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopLocations } from './top-locations';
import { InsightsData } from '../../insights-data';

describe('TopLocations', () => {
  let component: TopLocations;
  let fixture: ComponentFixture<TopLocations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopLocations],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(TopLocations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
