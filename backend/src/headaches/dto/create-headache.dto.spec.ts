import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateHeadacheDto } from './create-headache.dto.js';

const valid = {
  startedAt: '2026-01-01T10:00:00.000Z',
  endedAt: '2026-01-01T12:00:00.000Z',
  painLevel: 5,
  notes: '',
  locationIds: [1],
  triggerIds: [1, 2],
  symptomIds: [],
  reliefIds: [],
};

async function errorsFor(overrides: Record<string, unknown>) {
  const errors = await validate(plainToInstance(CreateHeadacheDto, { ...valid, ...overrides }));
  return errors.map((e) => e.property);
}

describe('CreateHeadacheDto', () => {
  it('accepts a valid payload (including empty notes)', async () => {
    expect(await errorsFor({})).toEqual([]);
  });

  it('rejects date-only and timezone-less dates', async () => {
    expect(await errorsFor({ startedAt: '2026-01-01' })).toContain('startedAt');
    expect(await errorsFor({ startedAt: '2026-01-01T10:00:00' })).toContain('startedAt');
  });

  it('rejects dates in the future', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(await errorsFor({ startedAt: future, endedAt: undefined })).toContain('startedAt');
    expect(await errorsFor({ endedAt: future })).toContain('endedAt');
  });

  it('rejects an end before the start', async () => {
    expect(await errorsFor({ endedAt: '2026-01-01T09:00:00.000Z' })).toContain('endedAt');
  });

  it('rejects duplicate, non-positive and oversized id arrays', async () => {
    expect(await errorsFor({ locationIds: [1, 1] })).toContain('locationIds');
    expect(await errorsFor({ triggerIds: [0] })).toContain('triggerIds');
    expect(await errorsFor({ symptomIds: Array.from({ length: 51 }, (_, i) => i + 1) })).toContain('symptomIds');
  });
});
