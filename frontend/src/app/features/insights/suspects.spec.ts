import { alwaysDone, Feature, probabilityHigher, rankSuspects, Session } from './suspects';

const feature = (key: string, kind: Feature['kind'] = 'exercise'): Feature => ({ key, name: key, kind });
const session = (headache: boolean, doses: Record<string, number>): Session => ({
  headache,
  doses: new Map(Object.entries(doses)),
});

describe('probabilityHigher', () => {
  it('is an even chance for equal counts', () => {
    expect(probabilityHigher({ workouts: 5, withHeadache: 2 }, { workouts: 5, withHeadache: 2 })).toBeCloseTo(0.5, 6);
  });

  it('matches a known value', () => {
    // Core group in the analysis that motivated this card: 4 of 7 with, 10 of 35 without
    expect(probabilityHigher({ workouts: 7, withHeadache: 4 }, { workouts: 35, withHeadache: 10 })).toBeCloseTo(0.926, 3);
  });

  it('trusts more workouts at the same rate', () => {
    const few = probabilityHigher({ workouts: 2, withHeadache: 2 }, { workouts: 20, withHeadache: 5 });
    const many = probabilityHigher({ workouts: 10, withHeadache: 10 }, { workouts: 20, withHeadache: 5 });
    expect(many).toBeGreaterThan(few);
  });
});

describe('rankSuspects', () => {
  const sessions = [
    ...Array.from({ length: 4 }, () => session(true, { crunch: 1, twist: 1, core: 2 })),
    session(false, { crunch: 1, twist: 1, core: 2 }),
    ...Array.from({ length: 5 }, (_, i) => session(i === 0, { press: 1, core: 0.5 })),
    ...Array.from({ length: 5 }, () => session(false, { press: 1 })),
  ];
  const features = [feature('crunch'), feature('twist'), feature('press'), feature('core', 'muscleGroup')];

  it('ranks the feature followed by headaches first', () => {
    const [top, ...rest] = rankSuspects(sessions, features);
    expect(top.features[0].key).toBe('core');
    expect(top.exposed).toEqual({ workouts: 5, withHeadache: 4 });
    expect(top.probability).toBeGreaterThan(0.95);
    expect(rest.map(s => s.features[0].key)).toEqual(['press']);
  });

  it('merges features done in the same workouts, naming them by the muscle group', () => {
    const [top] = rankSuspects(sessions, features);
    expect(top.features.map(f => f.key)).toEqual(['core', 'crunch', 'twist']);
  });

  it('leaves out workouts with only a secondary dose from both sides', () => {
    const [top] = rankSuspects(sessions, features);
    expect(top.unexposed.workouts).toBe(5);
  });

  it('skips features with too few workouts to compare', () => {
    expect(rankSuspects(sessions.slice(0, 2), features)).toEqual([]);
  });
});

describe('alwaysDone', () => {
  it('finds features in nearly every workout', () => {
    const sessions = [
      ...Array.from({ length: 6 }, () => session(false, { run: 1, curl: 1 })),
      ...Array.from({ length: 4 }, () => session(false, { curl: 1 })),
    ];
    expect(alwaysDone(sessions, [feature('run'), feature('curl')]).map(f => f.key)).toEqual(['curl']);
  });
});
