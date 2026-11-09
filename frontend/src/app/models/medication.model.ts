export type MedicationClass =
  | 'simple_painkiller'
  | 'nsaid'
  | 'triptan'
  | 'ergot'
  | 'opioid'
  | 'combination'
  | 'preventive'
  | 'other';

export type MedicationUse = 'as_needed' | 'preventive';

export type IntakeEffect = 'none' | 'some' | 'full';

export interface Medication {
  id: string;
  name: string;
  medicationClass: MedicationClass;
  defaultDose: string | null;
  use: MedicationUse;
  /** Set when the medication was removed but doses of it were kept. */
  archivedAt: string | null;
}

export interface MedicationPayload {
  name: string;
  medicationClass: MedicationClass;
  defaultDose: string | null;
  use: MedicationUse;
}

export interface MedicationIntake {
  id: string;
  medicationId: string;
  medication: Medication;
  takenAt: string;
  dose: string | null;
  headacheId: string | null;
  effect: IntakeEffect | null;
  effectAt: string | null;
}

/** Fields shared by a dose logged on its own and one in the headache form. */
export interface IntakeFieldsPayload {
  medicationId: string;
  takenAt: string;
  dose: string | null;
  effect: IntakeEffect | null;
  effectAt: string | null;
}

export interface CreateIntakePayload extends IntakeFieldsPayload {
  headacheId: string | null;
}

/** A dose in the headache form; `id` is set for doses already saved. */
export interface HeadacheIntakePayload extends IntakeFieldsPayload {
  id?: string;
}
