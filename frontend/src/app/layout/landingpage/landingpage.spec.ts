import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  NavigationEnd,
  ParamMap,
  Router,
} from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { DialogService } from '../../components/dialog/dialog.service';
import { signInRequiredQuery } from '../../guards/sign-in-redirect';
import { Landingpage } from './landingpage';

describe('Landingpage', () => {
  let fixture: ComponentFixture<Landingpage>;
  let queryParamMap: BehaviorSubject<ParamMap>;
  let events: Subject<unknown>;

  const dialogService = { open: vi.fn() };
  const router = { navigate: vi.fn(), events: new Subject<unknown>() };

  const navigationEnd = () => events.next(new NavigationEnd(1, '/', '/'));

  beforeEach(async () => {
    vi.resetAllMocks();
    queryParamMap = new BehaviorSubject(convertToParamMap({}));
    events = new Subject();
    router.events = events;

    await TestBed.configureTestingModule({
      imports: [Landingpage],
      providers: [
        { provide: DialogService, useValue: dialogService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { queryParamMap } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Landingpage);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not open a dialog on a normal visit', () => {
    expect(dialogService.open).not.toHaveBeenCalled();
  });

  it('opens sign-in with a notice when redirected here while already showing', () => {
    queryParamMap.next(convertToParamMap(signInRequiredQuery));

    expect(dialogService.open).toHaveBeenCalledWith('login', {
      notice: 'Please sign in to continue.',
    });
  });

  it('clears the flag only once the redirect navigation has finished', () => {
    queryParamMap.next(convertToParamMap(signInRequiredQuery));
    expect(router.navigate).not.toHaveBeenCalled();

    navigationEnd();

    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { signIn: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('opens a dialog from the menu and closes the menu', async () => {
    const host: HTMLElement = fixture.nativeElement;
    host.querySelector<HTMLButtonElement>('[aria-label="Open menu"]')!.click();
    await fixture.whenStable();
    const menu = host.querySelector('#landing-menu')!;
    expect(menu.classList).toContain('mat-drawer-opened');

    const about = [...menu.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'About',
    )!;
    about.click();
    await fixture.whenStable();

    expect(dialogService.open).toHaveBeenCalledWith('about');
    expect(menu.classList).not.toContain('mat-drawer-opened');
  });
});
