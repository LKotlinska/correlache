import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { DialogService } from '../../dialog/dialog.service';
import { HealthConsentCheckbox } from './health-consent-checkbox';

describe('HealthConsentCheckbox', () => {
  let fixture: ComponentFixture<HealthConsentCheckbox>;
  let control: FormControl<boolean | null>;
  const dialogService = { open: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    control = new FormControl(false, [Validators.requiredTrue]);

    await TestBed.configureTestingModule({
      imports: [HealthConsentCheckbox],
      providers: [{ provide: DialogService, useValue: dialogService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HealthConsentCheckbox);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('errorMessage', 'Consent needed');
    await fixture.whenStable();
  });

  const link = () => fixture.nativeElement.querySelector('a.text-link') as HTMLAnchorElement;

  it('opens the privacy policy on top without ticking the box', () => {
    link().click();

    expect(dialogService.open).toHaveBeenCalledWith('privacy');
    expect(control.value).toBe(false);
  });

  it('makes the privacy policy link reachable by keyboard', () => {
    expect(link().getAttribute('href')).toBe('#');
  });

  it('shows the error only once the box has been touched while unticked', async () => {
    expect(fixture.nativeElement.querySelector('.checkbox-error')).toBeNull();

    control.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.checkbox-error').textContent).toContain('Consent needed');
  });
});
