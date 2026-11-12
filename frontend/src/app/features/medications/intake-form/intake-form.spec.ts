import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { IntakeForm } from './intake-form';
import { MedicationService } from '../../../services/medication.service';
import { HeadacheService } from '../../../services/headache.service';
import { Medication, MedicationIntake } from '../../../models/medication.model';

const medication: Medication = {
  id: 'med-1',
  name: 'Ibuprofen',
  medicationClass: 'nsaid',
  defaultDose: '400 mg',
  use: 'as_needed',
  archivedAt: null,
};

const intake: MedicationIntake = {
  id: 'dose-1',
  medicationId: medication.id,
  medication,
  takenAt: '2026-11-01T10:00:00.000Z',
  dose: '400 mg',
  headacheId: 'headache-1',
  effect: null,
  effectAt: null,
};

describe('IntakeForm', () => {
  let fixture: ComponentFixture<IntakeForm>;
  let medicationService: {
    getMedications: ReturnType<typeof vi.fn>;
    getIntakeById: ReturnType<typeof vi.fn>;
    updateIntake: ReturnType<typeof vi.fn>;
    createIntake: ReturnType<typeof vi.fn>;
  };
  let headacheService: { getHeadaches: ReturnType<typeof vi.fn>; getHeadacheById: ReturnType<typeof vi.fn> };

  function setUp(id: string | null) {
    medicationService = {
      getMedications: vi.fn(() => of([medication])),
      getIntakeById: vi.fn(() => of(intake)),
      updateIntake: vi.fn(() => of(intake)),
      createIntake: vi.fn(() => of(intake)),
    };
    headacheService = {
      getHeadaches: vi.fn(() => of([])),
      getHeadacheById: vi.fn(() => throwError(() => new Error('offline'))),
    };
    TestBed.configureTestingModule({
      imports: [IntakeForm],
      providers: [
        // Saving navigates to the dose; any route will do here
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
        { provide: MedicationService, useValue: medicationService },
        { provide: HeadacheService, useValue: headacheService },
      ],
    });
    fixture = TestBed.createComponent(IntakeForm);
  }

  const form = () => fixture.nativeElement.querySelector('form');

  it('shows the form right away when adding a dose', async () => {
    setUp(null);
    await fixture.whenStable();

    expect(form()).not.toBeNull();
    expect(medicationService.getIntakeById).not.toHaveBeenCalled();
  });

  it('hides the form while the dose loads, so nothing can be saved over it', async () => {
    setUp('dose-1');
    const pending = new Subject<MedicationIntake>();
    medicationService.getIntakeById.mockReturnValue(pending);
    // whenStable() would wait for the pending request, so render without waiting
    TestBed.tick();

    expect(form()).toBeNull();
    fixture.componentInstance.onSubmit();
    expect(medicationService.updateIntake).not.toHaveBeenCalled();

    pending.next(intake);
    pending.complete();
    await fixture.whenStable();
    expect(form()).not.toBeNull();
  });

  it('shows a retryable error instead of the form when the dose fails to load', async () => {
    setUp('dose-1');
    medicationService.getIntakeById.mockReturnValue(throwError(() => new Error('offline')));
    await fixture.whenStable();

    expect(form()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("Couldn't load this dose.");
  });

  it('keeps the saved headache link even when that headache fails to load', async () => {
    setUp('dose-1');
    await fixture.whenStable();

    fixture.componentInstance.onSubmit();

    expect(medicationService.updateIntake).toHaveBeenCalledWith(
      'dose-1',
      expect.objectContaining({ headacheId: 'headache-1' }),
    );
  });
});
