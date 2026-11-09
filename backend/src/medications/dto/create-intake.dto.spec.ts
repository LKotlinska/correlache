import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateIntakeDto } from './create-intake.dto.js';
import { CreateMedicationDto } from './create-medication.dto.js';

const MED_ID = '00000000-0000-4000-8000-000000000001';

const valid = {
  medicationId: MED_ID,
  takenAt: '2026-01-01T10:00:00.000Z',
  dose: '400 mg',
  effect: 'some',
  effectAt: '2026-01-01T11:00:00.000Z',
  headacheId: null,
};

async function errorsFor(overrides: Record<string, unknown>) {
  const errors = await validate(plainToInstance(CreateIntakeDto, { ...valid, ...overrides }));
  return errors.map((e) => e.property);
}

describe('CreateIntakeDto', () => {
  it('accepts a valid payload, and one with only the required fields', async () => {
    expect(await errorsFor({})).toEqual([]);
    expect(await errorsFor({ dose: null, effect: null, effectAt: null })).toEqual([]);
  });

  it('rejects a dose in the future or without a timezone', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(await errorsFor({ takenAt: future, effectAt: null })).toContain('takenAt');
    expect(await errorsFor({ takenAt: '2026-01-01T10:00:00' })).toContain('takenAt');
  });

  it('rejects an effect time before the dose', async () => {
    expect(await errorsFor({ effectAt: '2026-01-01T09:00:00.000Z' })).toContain('effectAt');
  });

  it('requires a rating once an effect time is given', async () => {
    expect(await errorsFor({ effect: null })).toContain('effect');
    expect(await errorsFor({ effect: 'great' })).toContain('effect');
  });

  it('rejects a non-uuid medication or headache', async () => {
    expect(await errorsFor({ medicationId: '1' })).toContain('medicationId');
    expect(await errorsFor({ headacheId: 'abc' })).toContain('headacheId');
  });
});

describe('CreateMedicationDto', () => {
  const med = { name: 'Ibuprofen', medicationClass: 'nsaid', defaultDose: '400 mg', use: 'as_needed' };
  const medErrors = async (overrides: Record<string, unknown>) =>
    (await validate(plainToInstance(CreateMedicationDto, { ...med, ...overrides }))).map((e) => e.property);

  it('accepts a valid medication', async () => {
    expect(await medErrors({})).toEqual([]);
    expect(await medErrors({ defaultDose: null })).toEqual([]);
  });

  it('only accepts the fixed classes and uses', async () => {
    expect(await medErrors({ medicationClass: 'paracetamol' })).toContain('medicationClass');
    expect(await medErrors({ use: 'daily' })).toContain('use');
  });

  it('rejects an empty name', async () => {
    expect(await medErrors({ name: '' })).toContain('name');
  });
});
