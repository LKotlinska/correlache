import { matchPattern, PatternInput, patternLabel } from './headache-patterns';

const options = (...names: string[]) => names.map((name, id) => ({ id, name }));
const headache = (
  hours: number | null,
  painLevel: number,
  locations: string[],
  symptoms: string[],
  triggers: string[] = [],
): PatternInput => ({
  startedAt: '2026-11-01T10:00:00Z',
  endedAt: hours === null ? null : new Date(Date.parse('2026-11-01T10:00:00Z') + hours * 3_600_000).toISOString(),
  painLevel,
  locations: options(...locations),
  symptoms: options(...symptoms),
  triggers: options(...triggers),
});

const keys = (h: PatternInput) => {
  const m = matchPattern(h);
  return m.kind === 'match' ? m.patterns.map(p => p.key) : m.kind;
};

describe('matchPattern', () => {
  it('finds a migraine-like pattern', () => {
    const h = headache(
      20,
      8,
      ['Right side', 'Behind right eye'],
      ['Nausea', 'Light sensitivity', 'Sound sensitivity', 'Throbbing'],
      ['Hormonal shifts'],
    );
    expect(keys(h)).toEqual(['migraine']);
  });

  it('finds a tension-type-like pattern', () => {
    expect(keys(headache(5, 4, ['Forehead band'], ['Pressing or tightening'], ['Stress']))).toEqual(['tension']);
  });

  it('finds an exercise-related pattern', () => {
    expect(keys(headache(2, 6, ['Back of head'], ['Throbbing', 'Dizziness'], ['Cardio']))).toEqual(['exercise']);
  });

  it('finds a neck-related pattern', () => {
    const h = headache(4, 5, ['Scattered, scalp and neck'], ['Neck pain', 'Worse when moving neck'], ['Physical strain']);
    expect(keys(h)).toEqual(['neck']);
  });

  it('finds a sinus-related pattern', () => {
    expect(keys(headache(6, 5, ['Sinus area'], ['Congested nose'], ['Infection']))).toEqual(['sinus']);
  });

  it('only considers cluster-like with a watery eye or restlessness', () => {
    const h = headache(1, 9, ['Behind left eye'], ['Watery or red eye', 'Restlessness', 'Congested nose']);
    expect(keys(h)).toEqual(['cluster']);
    expect(keys(headache(1, 9, ['Behind left eye'], ['Congested nose']))).not.toContain('cluster');
  });

  it('shows patterns scoring close together as a mix', () => {
    const h = headache(null, 4, ['Forehead band', 'Back of head'], ['Neck pain']);
    const m = matchPattern(h);
    expect(m.kind).toBe('match');
    if (m.kind === 'match') {
      expect(m.patterns.map(p => p.key)).toEqual(['tension', 'neck']);
      expect(patternLabel(m.patterns)).toBe('Tension-type-like and neck-related');
    }
  });

  it('warns instead of matching for symptoms that can need a doctor', () => {
    expect(matchPattern(headache(2, 9, ['Whole head'], ['Sudden, severe onset', 'Throbbing']))).toEqual({
      kind: 'warning',
      symptoms: ['Sudden, severe onset'],
    });
    expect(matchPattern(headache(2, 5, ['Back of head'], ['Fever', 'Neck or shoulder stiffness'])).kind).toBe('warning');
  });

  it('needs a location or symptom', () => {
    expect(keys(headache(3, 4, [], [], ['Stress']))).toBe('too-little');
  });

  it('is unclear when nothing scores high enough', () => {
    expect(keys(headache(10, 7, ['Behind left eye', 'Behind right eye'], ['Nausea']))).toBe('unclear');
  });
});
