import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Settings } from './settings';
import { DialogService } from '../../components/dialog/dialog.service';
import { UserService } from '../../services/user.service';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  const logoutUser = vi.fn();
  const navigate = vi.fn();
  const open = vi.fn();
  const deleteAccount = vi.fn();
  const dialogOpen = vi.fn();

  beforeEach(async () => {
    logoutUser.mockReset();
    navigate.mockReset();
    open.mockReset();
    deleteAccount.mockReset();
    dialogOpen.mockReset();
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: UserService, useValue: { logoutUser, deleteAccount } },
        { provide: DialogService, useValue: { open: dialogOpen } },
        { provide: Router, useValue: { navigate } },
        { provide: MatSnackBar, useValue: { open } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates home after a successful sign out', () => {
    logoutUser.mockReturnValue(of(undefined));
    component.signOut();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('navigates home when the session is already gone (401)', () => {
    logoutUser.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    component.signOut();
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(open).not.toHaveBeenCalled();
  });

  it('stays on the page and shows an error for other failures', () => {
    logoutUser.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.signOut();
    expect(navigate).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(
      'Something went wrong. Please try again.',
      'Close',
      expect.anything(),
    );
  });

  it('deletes the account and navigates home once confirmed', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(true) });
    deleteAccount.mockReturnValue(of(undefined));
    component.confirmDeleteAccount();
    expect(deleteAccount).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('does nothing when the deletion is cancelled', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(undefined) });
    component.confirmDeleteAccount();
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  it('shows an error and stays when deletion fails', () => {
    dialogOpen.mockReturnValue({ afterClosed: () => of(true) });
    deleteAccount.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.confirmDeleteAccount();
    expect(navigate).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalled();
  });
});
