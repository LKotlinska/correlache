import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { DialogService } from '../../components/dialog/dialog.service';
import { Landingpage } from './landingpage';

describe('Landingpage', () => {
  let fixture: ComponentFixture<Landingpage>;

  const dialogService = { open: vi.fn() };
  const router = { navigate: vi.fn() };

  const setup = async (queryParams: Record<string, string> = {}) => {
    await TestBed.configureTestingModule({
      imports: [Landingpage],
      providers: [
        { provide: DialogService, useValue: dialogService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Landingpage);
    await fixture.whenStable();
  };

  beforeEach(() => vi.resetAllMocks());

  it('should create', async () => {
    await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not open a dialog on a normal visit', async () => {
    await setup();
    expect(dialogService.open).not.toHaveBeenCalled();
  });

  it('opens sign-in with a notice and clears the flag when redirected by the auth guard', async () => {
    await setup({ signIn: 'required' });

    expect(dialogService.open).toHaveBeenCalledWith('login', { notice: 'Please sign in to continue.' });
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { signIn: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});
