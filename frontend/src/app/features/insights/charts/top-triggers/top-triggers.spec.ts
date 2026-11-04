import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopTriggers } from './top-triggers';
import { InsightsData } from '../../insights-data';

describe('TopTriggers', () => {
  let component: TopTriggers;
  let fixture: ComponentFixture<TopTriggers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopTriggers],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(TopTriggers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
