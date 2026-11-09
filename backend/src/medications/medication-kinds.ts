/** Fixed list of medication classes. ICHD-3's overuse thresholds depend on the class. */
export const MEDICATION_CLASSES = [
  'simple_painkiller',
  'nsaid',
  'triptan',
  'ergot',
  'opioid',
  'combination',
  'preventive',
  'other',
] as const;
export type MedicationClass = (typeof MEDICATION_CLASSES)[number];

/** Whether a medication is taken when a headache comes on, or regularly to prevent them. */
export const MEDICATION_USES = ['as_needed', 'preventive'] as const;
export type MedicationUse = (typeof MEDICATION_USES)[number];

/** How much a dose helped. */
export const INTAKE_EFFECTS = ['none', 'some', 'full'] as const;
export type IntakeEffect = (typeof INTAKE_EFFECTS)[number];

/** Free-text dose such as "400 mg" or "1 tablet". */
export const MAX_DOSE_LENGTH = 50;
export const MAX_NAME_LENGTH = 100;
