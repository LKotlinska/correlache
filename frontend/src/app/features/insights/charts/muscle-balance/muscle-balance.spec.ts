import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MuscleBalance } from './muscle-balance';
import { InsightsData } from '../../insights-data';

describe('MuscleBalance', () => {
  let component: MuscleBalance;
  let fixture: ComponentFixture<MuscleBalance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuscleBalance],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(MuscleBalance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
