import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Settings } from './settings';
import { UserService } from '../../services/user.service';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  const logoutUser = vi.fn();
  const navigate = vi.fn();
  const open = vi.fn();

  beforeEach(async () => {
    logoutUser.mockReset();
    navigate.mockReset();
    open.mockReset();
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: UserService, useValue: { logoutUser } },
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
});
