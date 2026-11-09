import { Headache } from '../models/headache.model';
import { createIntakeGroup, defaultTakenAt, findOverlappingHeadaches, intakeGroupToPayload, selectableMedications } from './medication';
import { Medication } from '../models/medication.model';

const headache = (id: string, startedAt: string, endedAt: string | null): Headache => ({
  id,
  startedAt,
  endedAt,
  painLevel: 5,
  notes: null,
});

describe('findOverlappingHeadaches', () => {
  const at = new Date('2026-03-10T12:00:00Z');

  it('finds a headache that spans the dose', () => {
    const h = headache('a', '2026-03-10T10:00:00Z', '2026-03-10T14:00:00Z');
    expect(findOverlappingHeadaches([h], at)).toEqual([h]);
  });

  it('ignores headaches that ended before or started after the dose', () => {
    const ended = headache('a', '2026-03-10T08:00:00Z', '2026-03-10T09:00:00Z');
    const later = headache('b', '2026-03-10T13:00:00Z', null);
    expect(findOverlappingHeadaches([ended, later], at)).toEqual([]);
  });

  it('treats a headache with no end as ongoing for 72 hours only', () => {
    const recent = headache('a', '2026-03-09T12:00:00Z', null);
    const stale = headache('b', '2026-03-01T12:00:00Z', null);
    expect(findOverlappingHeadaches([recent], at)).toEqual([recent]);
    expect(findOverlappingHeadaches([stale], at)).toEqual([]);
  });

  it('lists every overlapping headache, latest-started first', () => {
    const older = headache('a', '2026-03-10T06:00:00Z', null);
    const newer = headache('b', '2026-03-10T11:00:00Z', '2026-03-10T13:00:00Z');
    expect(findOverlappingHeadaches([older, newer], at).map((h) => h.id)).toEqual(['b', 'a']);
  });
});

describe('defaultTakenAt', () => {
  const now = new Date('2026-03-10T12:00:00Z');
  const start = new Date('2026-03-10T09:00:00Z');

  it('is now while the headache is ongoing', () => {
    expect(defaultTakenAt(start, null, now)).toBe(now);
  });

  it("is the headache's start once it has ended", () => {
    expect(defaultTakenAt(start, new Date('2026-03-10T11:00:00Z'), now)).toBe(start);
  });
});

describe('intakeGroupToPayload', () => {
  const taken = new Date(2026, 2, 10, 9, 30);

  it('trims the dose and drops a relief time unless relief was rated', () => {
    const group = createIntakeGroup({
      medicationId: 'm1',
      dose: '  ',
      takenDate: taken,
      takenTime: taken,
      effect: 'none',
      effectDate: taken,
      effectTime: taken,
    });
    expect(intakeGroupToPayload(group)).toEqual({
      medicationId: 'm1',
      takenAt: taken.toISOString(),
      dose: null,
      effect: 'none',
      effectAt: null,
    });
  });

  it('flags relief before the dose', () => {
    const before = new Date(2026, 2, 10, 8, 0);
    const group = createIntakeGroup({ medicationId: 'm1', takenDate: taken, takenTime: taken, effect: 'full', effectDate: before, effectTime: before });
    expect(group.hasError('effectBeforeDose')).toBe(true);
  });
});

describe('selectableMedications', () => {
  const med = (id: string, archivedAt: string | null): Medication => ({
    id, name: id, medicationClass: 'nsaid', defaultDose: null, use: 'as_needed', archivedAt,
  });

  it('hides archived medications unless already chosen', () => {
    const list = [med('a', null), med('b', '2026-01-01T00:00:00Z')];
    expect(selectableMedications(list, null).map((m) => m.id)).toEqual(['a']);
    expect(selectableMedications(list, 'b').map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('hides preventives when they are not allowed, unless already chosen', () => {
    const list = [med('a', null), { ...med('p', null), use: 'preventive' as const }];
    expect(selectableMedications(list, null, false).map((m) => m.id)).toEqual(['a']);
    expect(selectableMedications(list, 'p', false).map((m) => m.id)).toEqual(['a', 'p']);
  });
});
