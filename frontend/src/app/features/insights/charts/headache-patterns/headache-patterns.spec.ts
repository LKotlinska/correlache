import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeadachePatterns } from './headache-patterns';
import { InsightsData } from '../../insights-data';

describe('HeadachePatterns', () => {
  let component: HeadachePatterns;
  let fixture: ComponentFixture<HeadachePatterns>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadachePatterns],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadachePatterns);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
