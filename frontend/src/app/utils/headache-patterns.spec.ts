import { matchPattern, PatternInput, patternLabel, scorePatterns } from './headache-patterns';

const options = (...names: string[]) => names.map((name, id) => ({ id, name }));
const headache = (
  hours: number | null,
  painLevel: number,
  locations: string[],
  symptoms: string[],
  triggers: string[] = [],
  intakes: PatternInput['intakes'] = [],
): PatternInput => ({
  startedAt: '2026-11-01T10:00:00Z',
  endedAt: hours === null ? null : new Date(Date.parse('2026-11-01T10:00:00Z') + hours * 3_600_000).toISOString(),
  painLevel,
  locations: options(...locations),
  symptoms: options(...symptoms),
  triggers: options(...triggers),
  intakes,
});

const keys = (h: PatternInput) => {
  const m = matchPattern(h);
  return m.kind === 'match' ? m.patterns.map(p => p.key) : m.kind;
};

const score = (h: PatternInput, key: string) => scorePatterns(h).find(s => s.key === key)!;

describe('matchPattern', () => {
  describe('migraine-like', () => {
    it('is found with its pain features and nausea', () => {
      const h = headache(
        20,
        8,
        ['Right side', 'Behind right eye'],
        ['Nausea', 'Light sensitivity', 'Sound sensitivity', 'Throbbing'],
        ['Hormonal shifts'],
      );
      expect(keys(h)).toEqual(['migraine']);
    });

    it('needs light and sound sensitivity together when there is no nausea', () => {
      expect(keys(headache(20, 7, ['Left side'], ['Throbbing', 'Light sensitivity']))).not.toContain('migraine');
      expect(keys(headache(20, 7, ['Left side'], ['Throbbing', 'Light sensitivity', 'Sound sensitivity']))).toEqual([
        'migraine',
      ]);
    });

    it('counts aura in place of nausea', () => {
      const h = headache(10, 6, ['Left side'], ['Throbbing', 'Zigzag lines or flashing lights', 'Worse with movement']);
      expect(keys(h)).toEqual(['migraine']);
    });

    it('needs at least 2 pain features', () => {
      expect(keys(headache(20, 3, ['Whole head'], ['Nausea', 'Throbbing']))).not.toContain('migraine');
    });
  });

  describe('tension-type-like', () => {
    it('is found with pain on both sides and pressing pain', () => {
      expect(keys(headache(5, 4, ['Forehead band'], ['Pressing or tightening'], ['Stress']))).toEqual(['tension']);
    });

    it('needs a logged feature, not just a location or a trigger', () => {
      expect(keys(headache(null, 4, ['Forehead band'], [], ['Stress']))).toBe('unclear');
    });

    it('is ruled out by nausea or by light and sound sensitivity together', () => {
      expect(keys(headache(5, 4, ['Forehead band'], ['Pressing or tightening', 'Nausea']))).not.toContain('tension');
      const h = headache(5, 4, ['Forehead band'], ['Pressing or tightening', 'Light sensitivity', 'Sound sensitivity']);
      expect(keys(h)).not.toContain('tension');
    });
  });

  describe('cluster-like', () => {
    it('is found with severe one-sided pain and eye signs', () => {
      const h = headache(1, 9, ['Behind left eye'], ['Watery or red eye', 'Restlessness', 'Runny nose']);
      expect(keys(h)).toEqual(['cluster']);
    });

    it('needs severe pain', () => {
      expect(keys(headache(1, 5, ['Behind left eye'], ['Watery or red eye', 'Restlessness']))).not.toContain('cluster');
    });

    it('needs an eye or nose sign or restlessness', () => {
      expect(keys(headache(1, 9, ['Behind left eye'], ['Throbbing']))).not.toContain('cluster');
      expect(keys(headache(1, 9, ['Behind left eye'], ['Drooping or swollen eyelid']))).toEqual(['cluster']);
    });
  });

  describe('exercise-related', () => {
    it('is found when exercise brought it on', () => {
      expect(keys(headache(2, 6, ['Back of head'], ['Throbbing'], ['Cardio']))).toEqual(['exercise']);
    });

    it('is ruled out when it lasted over 2 days', () => {
      expect(keys(headache(60, 6, ['Back of head'], ['Throbbing'], ['Cardio']))).not.toContain('exercise');
    });

    it("doesn't count coughing or straining", () => {
      expect(keys(headache(1, 6, ['Back of head'], ['Throbbing'], ['Cough or straining']))).not.toContain('exercise');
    });
  });

  describe('neck-related', () => {
    it('is found with a neck location and neck symptom', () => {
      const h = headache(4, 5, ['Scattered, scalp and neck'], ['Neck pain', 'Worse when moving neck'], ['Physical strain']);
      expect(keys(h)).toEqual(['neck']);
    });

    it('needs both', () => {
      expect(keys(headache(4, 5, ['Back of head'], ['Fatigue'], ['Tense muscles']))).not.toContain('neck');
    });
  });

  describe('sinus-related', () => {
    it('is found with the sinus area and a congested or runny nose', () => {
      expect(keys(headache(6, 5, ['Sinus area'], ['Congested nose'], ['Infection']))).toEqual(['sinus']);
      expect(keys(headache(6, 5, ['Sinus area'], ['Runny nose'], ['Infection']))).toEqual(['sinus']);
    });

    it('needs both', () => {
      expect(keys(headache(6, 5, ['Sinus area'], ['Fatigue'], ['Infection']))).not.toContain('sinus');
    });
  });

  describe('duration', () => {
    const migraine = (intakes: PatternInput['intakes']) =>
      headache(2, 7, ['Left side'], ['Throbbing', 'Nausea'], [], intakes);

    it('counts against a pattern when untreated', () => {
      expect(score(migraine([]), 'migraine').matched).not.toContain('lasted 4 to 72 hours');
      expect(score(migraine([]), 'migraine').score).toBeLessThan(score(migraine([{ effect: 'full' }]), 'migraine').score);
    });

    it("is left out when a dose helped or its effect wasn't logged", () => {
      const untreated = score(migraine([]), 'migraine').score;
      expect(score(migraine([{ effect: 'some' }]), 'migraine').score).toBeGreaterThan(untreated);
      expect(score(migraine([{ effect: null }]), 'migraine').score).toBeGreaterThan(untreated);
    });

    it("counts when a dose didn't help or was a preventive", () => {
      const untreated = score(migraine([]), 'migraine').score;
      expect(score(migraine([{ effect: 'none' }]), 'migraine').score).toBe(untreated);
      expect(score(migraine([{ effect: 'full', medication: { use: 'preventive' } }]), 'migraine').score).toBe(untreated);
    });

    it("is left out while the headache hasn't ended", () => {
      expect(score(migraine([]), 'migraine').score).toBeLessThan(
        score(headache(null, 7, ['Left side'], ['Throbbing', 'Nausea']), 'migraine').score,
      );
    });
  });

  it('shows patterns scoring close together as a mix', () => {
    const h = headache(
      null,
      4,
      ['Forehead band', 'Back of head'],
      ['Pressing or tightening', 'Neck pain', 'Worse when moving neck'],
      ['Tense muscles'],
    );
    const m = matchPattern(h);
    expect(m.kind).toBe('match');
    if (m.kind === 'match') {
      expect(m.patterns.map(p => p.key)).toEqual(['tension', 'neck']);
      expect(patternLabel(m.patterns)).toBe('Tension-type-like and neck-related');
    }
  });

  it('is unclear when a pattern has its core features but little else', () => {
    expect(keys(headache(100, 4, ['Left side'], ['Aura']))).toBe('unclear');
  });

  it('is unclear when no pattern has its core features', () => {
    expect(keys(headache(10, 7, ['Behind left eye', 'Behind right eye'], ['Nausea']))).toBe('unclear');
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
});
