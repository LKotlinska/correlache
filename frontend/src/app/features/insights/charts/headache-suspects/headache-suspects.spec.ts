import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeadacheSuspects } from './headache-suspects';
import { InsightsData } from '../../insights-data';

describe('HeadacheSuspects', () => {
  let component: HeadacheSuspects;
  let fixture: ComponentFixture<HeadacheSuspects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadacheSuspects],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadacheSuspects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
