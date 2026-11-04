import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MuscleBalance } from './muscle-balance';

describe('MuscleBalance', () => {
  let component: MuscleBalance;
  let fixture: ComponentFixture<MuscleBalance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuscleBalance],
    }).compileComponents();

    fixture = TestBed.createComponent(MuscleBalance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
