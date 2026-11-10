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

const dose = (effect: 'none' | 'some' | 'full' | null, use: 'as_needed' | 'preventive' = 'as_needed') => ({
  effect,
  medication: { use },
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

    it('is found whenever its criteria are met, however few other features there are', () => {
      expect(keys(headache(6, 4, ['Whole head'], ['Throbbing', 'Nausea']))).toEqual(['migraine']);
      expect(keys(headache(8, 6, ['Whole head'], ['Throbbing', 'Light sensitivity', 'Sound sensitivity']))).toEqual([
        'migraine',
      ]);
    });

    it('is found with aura alone, and aura rules out tension-type', () => {
      expect(keys(headache(5, 5, ['Whole head'], ['Throbbing', 'Zigzag lines or flashing lights']))).toEqual(['migraine']);
      expect(keys(headache(100, 4, ['Left side'], ['Aura']))).toEqual(['migraine']);
    });

    it("doesn't hold missing nausea against it when there is aura", () => {
      // One side 2, throbbing 1, moderate pain 1 and duration 1 out of those plus worse with movement 1.
      // Nausea and light and sound sensitivity don't count either way.
      expect(score(headache(10, 6, ['Left side'], ['Throbbing', 'Aura']), 'migraine').score).toBeCloseTo(5 / 6);
    });

    it("doesn't hold a missing hormonal trigger or aura against it", () => {
      const h = headache(10, 7, ['Left side'], ['Throbbing', 'Worse with movement', 'Nausea', 'Light sensitivity', 'Sound sensitivity']);
      expect(score(h, 'migraine').score).toBe(1);
      expect(score(h, 'migraine').matched).not.toContain('aura');
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

    it('needs to last 15 minutes to 3 hours when that is known', () => {
      expect(keys(headache(10, 8, ['Right side'], ['Congested nose']))).toBe('unclear');
      expect(keys(headache(null, 8, ['Right side'], ['Congested nose']))).toEqual(['cluster']);
    });

    it('counts restlessness and eye signs as alternatives', () => {
      expect(score(headache(1, 9, ['Behind left eye'], ['Restlessness']), 'cluster').score).toBe(1);
      expect(score(headache(1, 9, ['Behind left eye'], ['Watery or red eye']), 'cluster').score).toBe(1);
    });

    it('wins over migraine for a short attack with migraine symptoms', () => {
      const h = headache(1.5, 9, ['Behind left eye'], ['Watery or red eye', 'Nausea', 'Light sensitivity', 'Sound sensitivity', 'Throbbing']);
      expect(keys(h)).toEqual(['cluster']);
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

    it('gives way to migraine when the headache fits it', () => {
      const h = headache(6, 8, ['Left side'], ['Throbbing', 'Nausea', 'Light sensitivity', 'Sound sensitivity'], ['Cardio']);
      expect(keys(h)).toEqual(['migraine']);
      expect(score(h, 'exercise').score).toBe(0);
    });

    it('gives way to cluster when the headache fits it', () => {
      const h = headache(1, 9, ['Behind left eye'], ['Watery or red eye', 'Restlessness'], ['Physical strain']);
      expect(keys(h)).toEqual(['cluster']);
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

    it('is unclear with only its core features', () => {
      expect(keys(headache(4, 5, ['Back of head'], ['Neck pain']))).toBe('unclear');
    });

    it('still lists its core features as matched', () => {
      const h = headache(4, 5, ['Back of head'], ['Neck pain', 'Worse when moving neck']);
      expect(score(h, 'neck').matched).toEqual(['back of head or neck', 'neck pain or stiffness', 'worse when moving neck', 'not throbbing']);
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

    it('is unclear with only its core features', () => {
      expect(keys(headache(6, 5, ['Sinus area'], ['Runny nose']))).toBe('unclear');
    });
  });

  describe('duration', () => {
    const migraine = (intakes: PatternInput['intakes']) =>
      headache(2, 7, ['Left side'], ['Throbbing', 'Nausea'], [], intakes);

    it('counts against a pattern when untreated', () => {
      expect(score(migraine([]), 'migraine').matched).not.toContain('lasted 4 to 72 hours');
      expect(score(migraine([]), 'migraine').score).toBeLessThan(score(migraine([dose('full')]), 'migraine').score);
    });

    it('is left out when a dose helped', () => {
      const untreated = score(migraine([]), 'migraine').score;
      expect(score(migraine([dose('some')]), 'migraine').score).toBeGreaterThan(untreated);
      expect(score(migraine([dose('full')]), 'migraine').score).toBeGreaterThan(untreated);
    });

    it("counts when a dose didn't help, its effect wasn't logged, or it was a preventive", () => {
      const untreated = score(migraine([]), 'migraine').score;
      expect(score(migraine([dose('none')]), 'migraine').score).toBe(untreated);
      expect(score(migraine([dose(null)]), 'migraine').score).toBe(untreated);
      expect(score(migraine([dose('full', 'preventive')]), 'migraine').score).toBe(untreated);
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
