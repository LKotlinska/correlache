import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, of, throwError } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { AccountActions } from '../../../services/account-actions';
import { Router } from '@angular/router';
import { DialogService } from '../dialog.service';
import { Consent } from './consent';

describe('Consent', () => {
  let component: Consent;
  let fixture: ComponentFixture<Consent>;

  const userService = { giveConsent: vi.fn() };
  const accountActions = { signOut: vi.fn(), confirmDeleteAccount: vi.fn() };
  const dialogService = { open: vi.fn() };
  const dialogRef = { close: vi.fn() };
  const snackBar = { open: vi.fn() };
  const router = { navigate: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [Consent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AccountActions, useValue: accountActions },
        { provide: DialogService, useValue: dialogService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Consent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('has no close button, so the user has to choose', () => {
    expect(fixture.nativeElement.querySelector('[aria-label="Close dialog"]')).toBeNull();
  });

  it('does not record consent until the box is ticked', () => {
    component.giveConsent();

    expect(userService.giveConsent).not.toHaveBeenCalled();
    expect(component.consentControl.touched).toBe(true);
  });

  it('records consent and closes with "consented"', () => {
    userService.giveConsent.mockReturnValue(of(undefined));
    component.consentControl.setValue(true);

    component.giveConsent();

    expect(userService.giveConsent).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).toHaveBeenCalledWith('consented');
  });

  it('stays open and shows an error when recording consent fails', () => {
    userService.giveConsent.mockReturnValue(throwError(() => ({ error: { message: 'Server down' } })));
    component.consentControl.setValue(true);

    component.giveConsent();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Server down', 'Close', expect.objectContaining({ panelClass: 'snackbar-error' }));
    expect(component.isSubmitting()).toBe(false);
  });

  it('closes with "left" and goes home after signing out', () => {
    accountActions.signOut.mockReturnValue(of(undefined));

    component.signOut();

    expect(dialogRef.close).toHaveBeenCalledWith('left');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('closes with "left" once the account is deleted, and stays open when deletion is cancelled', () => {
    accountActions.confirmDeleteAccount.mockReturnValue(EMPTY);
    component.deleteAccount();
    expect(dialogRef.close).not.toHaveBeenCalled();

    accountActions.confirmDeleteAccount.mockReturnValue(of(undefined));
    component.deleteAccount();
    expect(dialogRef.close).toHaveBeenCalledWith('left');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
