import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { DialogService } from '../dialog.service';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  const userService = { createUser: vi.fn() };
  const dialogRef = { close: vi.fn() };
  const snackBar = { open: vi.fn() };
  const dialogService = { open: vi.fn(), switch: vi.fn() };

  const fillValidForm = () =>
    component.addUserForm.setValue({
      nameFormControl: 'Jane',
      emailFormControl: 'jane@example.com',
      passwordFormControl: 'supersecret',
      termsFormControl: true,
      healthConsentFormControl: true,
    });

  beforeEach(async () => {
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: DialogService, useValue: dialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
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

  it('requires explicit health data consent, separately from the terms', () => {
    fillValidForm();
    component.addUserForm.controls.healthConsentFormControl.setValue(false);

    component.onSubmit();

    expect(userService.createUser).not.toHaveBeenCalled();
    expect(component.addUserForm.controls.healthConsentFormControl.invalid).toBe(true);
    expect(component.termsInvalid).toBe(false);
  });

  it('opens the terms on top, keeping what was filled in and leaving the box unticked', () => {
    component.addUserForm.controls.nameFormControl.setValue('Jane');
    const termsLink = [...fixture.nativeElement.querySelectorAll('a.text-link')].find(
      (a: HTMLAnchorElement) => a.textContent?.includes('Terms'),
    ) as HTMLAnchorElement;

    termsLink.click();

    expect(dialogService.open).toHaveBeenCalledWith('terms');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.addUserForm.controls.nameFormControl.value).toBe('Jane');
    expect(component.addUserForm.controls.termsFormControl.value).toBe(false);
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
      healthDataConsent: true,
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
