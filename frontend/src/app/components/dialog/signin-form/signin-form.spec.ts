import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { UserService } from '../../../services/user-service';
import { SigninForm } from './signin-form';

describe('SigninForm', () => {
  let component: SigninForm;
  let fixture: ComponentFixture<SigninForm>;

  const userService = { authUser: vi.fn() };
  const dialogRef = { close: vi.fn() };
  const router = { navigate: vi.fn() };

  const fillValidForm = () =>
    component.signInForm.setValue({
      emailFormControl: 'jane@example.com',
      passwordFormConrol: 'supersecret',
    });

  beforeEach(async () => {
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [SigninForm],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SigninForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call the service and marks fields touched when the form is invalid', () => {
    component.onSubmit();

    expect(userService.authUser).not.toHaveBeenCalled();
    expect(component.signInForm.controls.emailFormControl.touched).toBe(true);
  });

  it('closes the dialog and navigates to the dashboard on success', () => {
    userService.authUser.mockReturnValue(of({}));
    fillValidForm();

    component.onSubmit();

    expect(userService.authUser).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'supersecret',
    });
    expect(dialogRef.close).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/user/insights']);
  });

  it('shows a credentials message and re-enables submit on 401', () => {
    userService.authUser.mockReturnValue(throwError(() => ({ status: 401 })));
    fillValidForm();

    component.onSubmit();

    expect(component.errorMessage()).toBe('Wrong email or password.');
    expect(component.isSubmitting()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows a generic message on other errors', () => {
    userService.authUser.mockReturnValue(throwError(() => ({ status: 500 })));
    fillValidForm();

    component.onSubmit();

    expect(component.errorMessage()).toBe('Something went wrong. Please try again.');
  });

  it('keeps submit disabled while the request is in flight', () => {
    userService.authUser.mockReturnValue(new Subject());
    fillValidForm();

    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
  });
});
