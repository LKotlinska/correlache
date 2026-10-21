import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { SignupForm } from './signup-form';

describe('SignupForm', () => {
  let component: SignupForm;
  let fixture: ComponentFixture<SignupForm>;

  const userService = { createUser: vi.fn() };
  const dialogRef = { close: vi.fn() };
  const snackBar = { open: vi.fn() };

  const fillValidForm = () =>
    component.addUserForm.setValue({
      nameFormControl: 'Jane',
      emailFormControl: 'jane@example.com',
      passwordFormControl: 'supersecret',
      termsFormControl: true,
    });

  beforeEach(async () => {
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [SignupForm],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call the service and marks fields touched when the form is invalid', () => {
    component.onSubmit();

    expect(userService.createUser).not.toHaveBeenCalled();
    expect(component.addUserForm.controls.nameFormControl.touched).toBe(true);
    expect(component.termsInvalid).toBe(true);
  });

  it('requires the terms to be accepted', () => {
    fillValidForm();
    component.addUserForm.controls.termsFormControl.setValue(false);

    component.onSubmit();

    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('shows the terms error only once the checkbox has been touched', () => {
    expect(component.termsInvalid).toBe(false);

    component.addUserForm.controls.termsFormControl.markAsTouched();

    expect(component.termsInvalid).toBe(true);
  });

  it('sends the form values, closes the dialog and shows a success snackbar', () => {
    userService.createUser.mockReturnValue(of({}));
    fillValidForm();

    component.onSubmit();

    expect(userService.createUser).toHaveBeenCalledWith({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'supersecret',
    });
    expect(dialogRef.close).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Registered successfully',
      'Close',
      expect.objectContaining({ panelClass: 'snackbar-success' }),
    );
  });

  it('ignores a second submit while the first request is in flight', () => {
    userService.createUser.mockReturnValue(new Subject());
    fillValidForm();

    component.onSubmit();
    component.onSubmit();

    expect(userService.createUser).toHaveBeenCalledTimes(1);
    expect(component.isSubmitting()).toBe(true);
  });

  it('keeps the dialog open, shows the server message and re-enables submit on error', () => {
    userService.createUser.mockReturnValue(
      throwError(() => ({ error: { message: 'Email already registered' } })),
    );
    fillValidForm();

    component.onSubmit();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Email already registered',
      'Close',
      expect.objectContaining({ panelClass: 'snackbar-error' }),
    );
    expect(component.isSubmitting()).toBe(false);
  });

  it('flags the email field instead of showing a snackbar when the email is taken', () => {
    userService.createUser.mockReturnValue(
      throwError(() => ({ status: 409, error: { code: 'EMAIL_TAKEN', message: 'Email already registered' } })),
    );
    fillValidForm();

    component.onSubmit();

    expect(component.addUserForm.controls.emailFormControl.errors).toEqual({ emailTaken: true });
    expect(snackBar.open).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('joins an array of validation messages', () => {
    userService.createUser.mockReturnValue(
      throwError(() => ({ error: { message: ['name is too long', 'email must be an email'] } })),
    );
    fillValidForm();

    component.onSubmit();

    expect(snackBar.open).toHaveBeenCalledWith(
      'name is too long. email must be an email',
      'Close',
      expect.any(Object),
    );
  });

  it('falls back to a generic message when the error has no body', () => {
    userService.createUser.mockReturnValue(throwError(() => ({ error: null })));
    fillValidForm();

    component.onSubmit();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Something went wrong. Please try again.',
      'Close',
      expect.any(Object),
    );
  });
});
