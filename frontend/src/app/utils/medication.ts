import { FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Headache } from '../models/headache.model';
import {
  IntakeEffect,
  IntakeFieldsPayload,
  Medication,
  MedicationClass,
  MedicationIntake,
  MedicationUse,
} from '../models/medication.model';
import { combineDateTime } from './combine-date-time';

// Same caps as the backend
export const MAX_DOSE_LENGTH = 50;
export const MAX_MEDICATION_NAME_LENGTH = 100;

export const MEDICATION_CLASS_LABELS: Record<MedicationClass, string> = {
  simple_painkiller: 'Simple painkiller (e.g. paracetamol)',
  nsaid: 'NSAID (e.g. ibuprofen)',
  triptan: 'Triptan',
  ergot: 'Ergot',
  opioid: 'Opioid',
  combination: 'Combination',
  preventive: 'Preventive',
  other: 'Other',
};

export const MEDICATION_USE_LABELS: Record<MedicationUse, string> = {
  as_needed: 'As needed',
  preventive: 'Preventive (taken regularly)',
};

export const INTAKE_EFFECT_LABELS: Record<IntakeEffect, string> = {
  none: 'No relief',
  some: 'Some relief',
  full: 'Full relief',
};

export const MEDICATION_CLASS_OPTIONS = Object.entries(MEDICATION_CLASS_LABELS).map(([value, label]) => ({
  value: value as MedicationClass,
  label,
}));

/** Answers to "Did it help?" in the form; the diary and detail views use the longer labels above. */
export const INTAKE_EFFECT_OPTIONS: { value: IntakeEffect; label: string }[] = [
  { value: 'none', label: 'No' },
  { value: 'some', label: 'Some relief' },
  { value: 'full', label: 'Yes' },
];

/** A headache with no end only counts as ongoing for this long after it started. */
const OPEN_HEADACHE_WINDOW_MS = 72 * 60 * 60 * 1000;

/**
 * The headache a dose taken at `takenAt` most likely belongs to: the latest one that started by then
 * and had not ended, or that has no end and started within the last 72 hours.
 */
export function findOverlappingHeadache(headaches: Headache[], takenAt: Date): Headache | null {
  const time = takenAt.getTime();
  const overlapping = headaches.filter((h) => {
    const start = new Date(h.startedAt).getTime();
    if (start > time) return false;
    if (h.endedAt) return new Date(h.endedAt).getTime() >= time;
    return time - start <= OPEN_HEADACHE_WINDOW_MS;
  });
  return overlapping.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
}

/** When a dose added in the headache form was likely taken: now while the headache is ongoing, else its start. */
export function defaultTakenAt(start: Date | null, end: Date | null, now = new Date()): Date {
  if (!start) return now;
  return !end && now >= start ? now : start;
}

/** "Ibuprofen 400 mg". */
export function intakeLabel(intake: Pick<MedicationIntake, 'medication' | 'dose'>): string {
  return [intake.medication.name, intake.dose].filter(Boolean).join(' ');
}

/** Medications to offer in a picker: active ones, plus the one already chosen even if it was archived since. */
export function selectableMedications(all: Medication[], selectedId: string | null): Medication[] {
  return all.filter((m) => !m.archivedAt || m.id === selectedId);
}

/** Group validator: the dose can't be in the future, and the effect can't come before the dose. */
const intakeTimesValid: ValidatorFn = (group): ValidationErrors | null => {
  const { takenAt, effectAt } = readIntakeTimes(group as IntakeGroup);
  if (!takenAt) return null;
  const now = Date.now();
  if (new Date(takenAt).getTime() > now || (effectAt && new Date(effectAt).getTime() > now)) {
    return { futureDate: true };
  }
  if (effectAt && new Date(effectAt) < new Date(takenAt)) return { effectBeforeDose: true };
  return null;
};

export interface IntakeGroupValue {
  id?: string;
  medicationId: string | null;
  dose: string;
  takenDate: Date | null;
  takenTime: Date | null;
  effect: IntakeEffect | null;
  effectDate: Date | null;
  effectTime: Date | null;
}

export function createIntakeGroup(value: Partial<IntakeGroupValue> = {}) {
  const takenAt = value.takenDate ?? new Date();
  return new FormGroup(
    {
      id: new FormControl<string | undefined>(value.id, { nonNullable: true }),
      medicationId: new FormControl<string | null>(value.medicationId ?? null, { validators: [Validators.required] }),
      dose: new FormControl<string>(value.dose ?? '', {
        nonNullable: true,
        validators: [Validators.maxLength(MAX_DOSE_LENGTH)],
      }),
      takenDate: new FormControl<Date | null>(takenAt, { validators: [Validators.required] }),
      takenTime: new FormControl<Date | null>(value.takenTime ?? takenAt, { validators: [Validators.required] }),
      effect: new FormControl<IntakeEffect | null>(value.effect ?? null),
      effectDate: new FormControl<Date | null>(value.effectDate ?? null),
      effectTime: new FormControl<Date | null>(value.effectTime ?? null),
    },
    { validators: [intakeTimesValid] },
  );
}

export type IntakeGroup = ReturnType<typeof createIntakeGroup>;

/** Form values for a saved dose. */
export function intakeToGroupValue(intake: MedicationIntake): IntakeGroupValue {
  const taken = new Date(intake.takenAt);
  const effect = intake.effectAt ? new Date(intake.effectAt) : null;
  return {
    id: intake.id,
    medicationId: intake.medicationId,
    dose: intake.dose ?? '',
    takenDate: taken,
    takenTime: taken,
    effect: intake.effect,
    effectDate: effect,
    effectTime: effect,
  };
}

function readIntakeTimes(group: IntakeGroup) {
  const { takenDate, takenTime, effect, effectDate, effectTime } = group.getRawValue();
  const takenAt = takenDate && takenTime ? combineDateTime(takenDate, takenTime) : null;
  // The effect time only counts once relief was rated; a date with no time is read as the dose's time of day
  const effectAt = effect && effect !== 'none' && effectDate ? combineDateTime(effectDate, effectTime ?? takenTime) : null;
  return { takenAt, effectAt };
}

/** The API fields of a valid intake group. */
export function intakeGroupToPayload(group: IntakeGroup): IntakeFieldsPayload & { id?: string } {
  const { id, medicationId, dose, effect } = group.getRawValue();
  const { takenAt, effectAt } = readIntakeTimes(group);
  return {
    ...(id ? { id } : {}),
    medicationId: medicationId!,
    takenAt: takenAt!,
    dose: dose.trim() || null,
    // A deselected chip leaves undefined
    effect: effect ?? null,
    effectAt,
  };
}
