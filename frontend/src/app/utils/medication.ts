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
import { FormProblem } from '../components/form-error-summary/form-error-summary';

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

export const INTAKE_EFFECT_OPTIONS = Object.entries(INTAKE_EFFECT_LABELS).map(([value, label]) => ({
  value: value as IntakeEffect,
  label,
}));

/** A headache with no end only counts as ongoing for this long after it started. */
export const OPEN_HEADACHE_WINDOW_MS = 72 * 60 * 60 * 1000;

/**
 * The headaches a dose taken at `takenAt` may belong to, latest-started first: those that started by then
 * and had not ended, or that have no end and started within the last 72 hours.
 */
export function findOverlappingHeadaches(headaches: Headache[], takenAt: Date): Headache[] {
  const time = takenAt.getTime();
  return headaches
    .filter((h) => {
      const start = new Date(h.startedAt).getTime();
      if (start > time) return false;
      if (h.endedAt) return new Date(h.endedAt).getTime() >= time;
      return time - start <= OPEN_HEADACHE_WINDOW_MS;
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
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

/**
 * Whether doses of this medication are taken regularly rather than for a headache.
 * Such doses aren't rated for relief or linked to a headache: a preventive's effect shows over weeks, not per dose.
 */
export function isPreventive(medication: Medication | undefined): boolean {
  return medication?.use === 'preventive';
}

/**
 * Medications to offer in a picker: active ones, plus the one already chosen even if it was archived since.
 * Preventives are left out where `allowPreventive` is false, as in the headache form.
 */
export function selectableMedications(all: Medication[], selectedId: string | null, allowPreventive = true): Medication[] {
  return all.filter(
    (m) => m.id === selectedId || (!m.archivedAt && (allowPreventive || !isPreventive(m))),
  );
}

/**
 * What's wrong with a dose, for a form's error summary. `label` starts each message where a form has several doses,
 * e.g. "Medication 2", and `idPrefix` is the one given to its app-intake-fields, so each problem points at its field.
 */
export function intakeProblems(group: IntakeGroup, idPrefix: string, label?: string): FormProblem[] {
  const { medicationId, dose, takenDate, takenTime } = group.controls;
  const message = (text: string) => (label ? `${label}: ${text[0].toLowerCase()}${text.slice(1)}` : text);
  const problems: FormProblem[] = [];
  if (medicationId.invalid) problems.push({ message: message('Choose a medication'), target: `${idPrefix}-medication` });
  if (dose.invalid) problems.push({ message: message('The dose is too long'), target: `${idPrefix}-dose` });
  if (takenDate.invalid || takenTime.invalid) {
    problems.push({ message: message('Pick when it was taken'), target: `${idPrefix}-taken` });
  }
  if (group.hasError('futureDate')) {
    problems.push({ message: message("Doses can't be logged in the future"), target: `${idPrefix}-taken` });
  }
  if (group.hasError('effectBeforeDose')) {
    problems.push({ message: message("Relief can't start before the dose"), target: `${idPrefix}-effect` });
  }
  return problems;
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
