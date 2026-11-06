import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HardSessionHeadaches } from './hard-session-headaches';
import { InsightsData } from '../../insights-data';

describe('HardSessionHeadaches', () => {
  let component: HardSessionHeadaches;
  let fixture: ComponentFixture<HardSessionHeadaches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HardSessionHeadaches],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(HardSessionHeadaches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
