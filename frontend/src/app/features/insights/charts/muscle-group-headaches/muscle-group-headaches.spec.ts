import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MuscleGroupHeadaches } from './muscle-group-headaches';
import { InsightsData } from '../../insights-data';

describe('MuscleGroupHeadaches', () => {
  let component: MuscleGroupHeadaches;
  let fixture: ComponentFixture<MuscleGroupHeadaches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuscleGroupHeadaches],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(MuscleGroupHeadaches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
