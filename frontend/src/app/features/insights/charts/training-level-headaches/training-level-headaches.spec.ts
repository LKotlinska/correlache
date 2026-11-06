import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrainingLevelHeadaches } from './training-level-headaches';
import { InsightsData } from '../../insights-data';

describe('TrainingLevelHeadaches', () => {
  let component: TrainingLevelHeadaches;
  let fixture: ComponentFixture<TrainingLevelHeadaches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingLevelHeadaches],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingLevelHeadaches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
