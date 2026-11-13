import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeadacheSuspects } from './headache-suspects';
import { InsightsData } from '../../insights-data';
import { Feature, Suspect } from '../../suspects';

describe('HeadacheSuspects', () => {
  let component: HeadacheSuspects;
  let fixture: ComponentFixture<HeadacheSuspects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadacheSuspects],
      providers: [InsightsData],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadacheSuspects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('labels a pattern by how likely it is', () => {
    expect(component.strength(0.97)).toEqual({ label: 'Strong', bars: 3 });
    expect(component.strength(0.9)).toEqual({ label: 'Strong', bars: 3 });
    expect(component.strength(0.89)).toEqual({ label: 'Moderate', bars: 2 });
    expect(component.strength(0.75)).toEqual({ label: 'Moderate', bars: 2 });
    expect(component.strength(0.6)).toEqual({ label: 'Weak', bars: 1 });
  });

  describe('names', () => {
    const count = { workouts: 5, withHeadache: 2 };
    const suspect = (...features: Feature[]): Suspect => ({ features, exposed: count, unexposed: count, probability: 0.9 });
    const exercise = (name: string): Feature => ({ key: `exercise:${name}`, name, kind: 'exercise' });
    const group = (name: string): Feature => ({ key: `group:${name}`, name, kind: 'muscleGroup' });

    it('names a lone exercise or muscle group as it is, with no list', () => {
      expect(component.name(suspect(exercise('Deadlift')))).toBe('Deadlift');
      expect(component.members(suspect(exercise('Deadlift')))).toEqual([]);
      expect(component.name(suspect(group('Legs')))).toBe('Legs');
    });

    it('shortens exercises done together and lists them all', () => {
      const s = suspect(exercise('Jump rope'), exercise('Burpee'), exercise('Push-up'));
      expect(component.name(s)).toBe('Jump rope + 2 more');
      expect(component.members(s)).toEqual(['Jump rope', 'Burpee', 'Push-up']);
    });

    it('names a muscle group by itself and lists its exercises', () => {
      const s = suspect(group('Core'), exercise('Russian twist'), exercise('Dead bug'));
      expect(component.name(s)).toBe('Core');
      expect(component.members(s)).toEqual(['Russian twist', 'Dead bug']);
    });
  });

  it('reads a bar out as counts', () => {
    expect(component.countLabel({ workouts: 8, withHeadache: 5 }, 'with it')).toBe(
      'Headache after 5 of 8 workouts with it',
    );
  });
});
