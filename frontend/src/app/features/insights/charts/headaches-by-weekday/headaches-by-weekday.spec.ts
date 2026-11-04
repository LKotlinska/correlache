import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeadachesByWeekday } from './headaches-by-weekday';

describe('HeadachesByWeekday', () => {
  let component: HeadachesByWeekday;
  let fixture: ComponentFixture<HeadachesByWeekday>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadachesByWeekday],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadachesByWeekday);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
