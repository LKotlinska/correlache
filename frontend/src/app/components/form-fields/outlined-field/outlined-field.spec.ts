import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { OutlinedField } from './outlined-field';

describe('OutlinedField', () => {
  let component: OutlinedField;
  let fixture: ComponentFixture<OutlinedField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutlinedField],
    }).compileComponents();

    fixture = TestBed.createComponent(OutlinedField);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('myControl', new FormControl(''));
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the email-taken message once the control carries that error', () => {
    component.myControl().setErrors({ emailTaken: true });

    expect(component.getErrorMessage()).toBe('This email is already registered');
  });
});
