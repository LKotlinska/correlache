import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntensityVsPain } from './intensity-vs-pain';
import { InsightsData } from '../../insights-data';

describe('IntensityVsPain', () => {
  let component: IntensityVsPain;
  let fixture: ComponentFixture<IntensityVsPain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntensityVsPain],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(IntensityVsPain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
