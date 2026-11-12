import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HeadacheForm } from './headache-form';
import { HeadacheService } from '../../../services/headache.service';
import { MedicationService } from '../../../services/medication.service';

describe('HeadacheForm', () => {
  let component: HeadacheForm;
  let fixture: ComponentFixture<HeadacheForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadacheForm],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadacheForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('HeadacheForm on the edit route', () => {
  let fixture: ComponentFixture<HeadacheForm>;
  const headacheService = {
    getOptions: vi.fn(() => of({ headacheLocations: [], triggers: [], symptoms: [], reliefMeasures: [] })),
    getHeadacheById: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [HeadacheForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'headache-1' }) } } },
        { provide: HeadacheService, useValue: headacheService },
        { provide: MedicationService, useValue: { getMedications: () => of([]) } },
      ],
    });
  });

  const form = () => fixture.nativeElement.querySelector('form');

  it('hides the form while the headache loads, so its defaults can never be saved over it', () => {
    headacheService.getHeadacheById.mockReturnValue(new Subject());
    fixture = TestBed.createComponent(HeadacheForm);
    // whenStable() would wait for the pending request, so render without waiting
    TestBed.tick();

    expect(form()).toBeNull();
    fixture.componentInstance.onSubmit();
    expect(headacheService.update).not.toHaveBeenCalled();
  });

  it('shows a retryable error instead of the form when the headache fails to load', async () => {
    headacheService.getHeadacheById.mockReturnValue(throwError(() => new Error('offline')));
    fixture = TestBed.createComponent(HeadacheForm);
    await fixture.whenStable();

    expect(form()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("Couldn't load this headache.");
  });
});
