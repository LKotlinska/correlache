import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeadacheForm } from './headache-form';

describe('HeadacheForm', () => {
  let component: HeadacheForm;
  let fixture: ComponentFixture<HeadacheForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadacheForm],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadacheForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
