import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { DialogService } from '../../../components/dialog/dialog.service';
import { Exercise } from '../../../models/workout.model';
import { WorkoutService } from '../../../services/workout.service';
import { WorkoutImport } from './workout-import';

const exercise = (id: number, name: string): Exercise => ({
  id,
  name,
  imageName: null,
  gifName: null,
  equipment: { id: 1, name: 'dumbbell' },
  bodyPart: { id: 1, name: 'upper arms' },
  muscles: [],
});

const library = [
  exercise(1, 'dumbbell biceps curl'),
  exercise(2, 'dumbbell incline bench press'),
  exercise(3, 'barbell incline bench press'),
];

const EXPORT = [
  'Title,Date,Duration,Exercise,Superset id,Weight,Reps,Distance,Time,Set Type',
  'Upper A,2026-10-12 09:56:14,01:09:12,Run on Treadmill ,,,,3.30,27:00,NORMAL_SET',
  'Upper A,2026-10-12 09:56:14,01:09:12,Biceps Curl,,5.000,10,,,WARMUP_SET',
  'Upper A,2026-10-12 09:56:14,01:09:12,Biceps Curl,,5.000,8,,,NORMAL_SET',
  'Upper A,2026-10-12 09:56:14,01:09:12,Incline Bench Press,,6.000,12,,,NORMAL_SET',
].join('\n');

describe('WorkoutImport', () => {
  let fixture: ComponentFixture<WorkoutImport>;
  let component: WorkoutImport;
  let importWorkouts: ReturnType<typeof vi.fn>;

  const status = () =>
    (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent?.trim();

  beforeEach(async () => {
    importWorkouts = vi.fn(() => of({ imported: 1, skipped: 0 }));
    TestBed.configureTestingModule({
      imports: [WorkoutImport],
      providers: [
        provideRouter([]),
        { provide: WorkoutService, useValue: { getExercises: () => of(library), importWorkouts } },
        { provide: DialogService, useValue: { open: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(WorkoutImport);
    component = fixture.componentInstance;
    component.file.set({ name: 'lyfta.csv', text: EXPORT });
    await fixture.whenStable();
  });

  it('lists the names that need a decision, and the automatic matches apart', () => {
    expect(component.toReview().map((row) => [row.name, row.match.kind])).toEqual([
      ['Incline Bench Press', 'choose'],
      ['Run on Treadmill', 'unmatched'],
    ]);
    expect(component.autoMatched().map((row) => row.name)).toEqual(['Biceps Curl']);
    expect(status()).toBe('2 names need an exercise or a skip.');
  });

  it('is ready once every name has an exercise or a skip', async () => {
    component.choose('Incline Bench Press', library[1]);
    component.skip('Run on Treadmill');
    await fixture.whenStable();

    expect(component.payloads()?.[0].exercises.map((e) => e.exerciseId)).toEqual([1, 2]);
    expect(status()).toBe('Ready to import 1 workout with 3 sets.');

    component.includeWarmups.set(false);
    await fixture.whenStable();
    expect(status()).toBe('Ready to import 1 workout with 2 sets.');
  });

  it('keeps the choices when the units change', async () => {
    component.skip('Run on Treadmill');
    component.weightUnit.set('lb');
    await fixture.whenStable();
    expect(component.choices().get('Run on Treadmill')).toEqual({ kind: 'skip' });
  });

  it('can go back to the automatic match', async () => {
    const curl = component.autoMatched()[0];
    component.skip(curl.name);
    component.reset(curl);
    expect(component.choices().get(curl.name)).toEqual({ kind: 'exercise', exercise: library[0] });
  });

  it('explains when the file is not a Lyfta export', async () => {
    component.file.set({ name: 'strong.csv', text: 'Date;Workout Name;Duration\n' });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'This file does not look like a Lyfta export.',
    );
  });

  describe('saving', () => {
    const importButton = () =>
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) =>
        ['Import workouts', 'Try again'].includes(b.textContent?.trim() ?? ''),
      );
    const decideAll = async () => {
      component.choose('Incline Bench Press', library[1]);
      component.skip('Run on Treadmill');
      await fixture.whenStable();
    };

    it('can only start once every name is decided', async () => {
      expect(importButton()?.disabled).toBe(true);
      await decideAll();
      expect(importButton()?.disabled).toBe(false);
    });

    it('sends the workouts and reports the result', async () => {
      await decideAll();
      await component.importWorkouts();
      await fixture.whenStable();

      expect(importWorkouts).toHaveBeenCalledWith(component.payloads());
      expect(status()).toBe('Imported 1 workout.');
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('a[href="/user/diary"]'),
      ).not.toBeNull();
    });

    it('sends at most one batch of workouts per request', async () => {
      const rows = Array.from(
        { length: 21 },
        (_, day) =>
          `Upper A,2026-09-${String(day + 1).padStart(2, '0')} 09:00:00,01:00:00,Biceps Curl,,5.000,10,,,NORMAL_SET`,
      );
      component.file.set({ name: 'lyfta.csv', text: [EXPORT.split('\n')[0], ...rows].join('\n') });
      importWorkouts.mockImplementation((batch: unknown[]) =>
        of({ imported: batch.length, skipped: 0 }),
      );
      await fixture.whenStable();

      await component.importWorkouts();

      expect(importWorkouts.mock.calls.map(([batch]) => batch.length)).toEqual([20, 1]);
      expect(component.saveState()).toEqual({ kind: 'done', imported: 21, skipped: 0 });
    });

    it('explains a failure and offers to try again', async () => {
      await decideAll();
      importWorkouts.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({ status: 400, error: { message: 'Unknown exercise id(s): 2' } }),
        ),
      );
      await component.importWorkouts();
      await fixture.whenStable();

      expect(status()).toContain(
        'The import stopped after saving 0 workouts: Unknown exercise id(s): 2',
      );
      expect(importButton()?.textContent?.trim()).toBe('Try again');

      await component.importWorkouts();
      expect(component.saveState()).toEqual({ kind: 'done', imported: 1, skipped: 0 });
    });

    it('starts over when another file is chosen', async () => {
      await decideAll();
      await component.importWorkouts();
      component.file.set({ name: 'other.csv', text: EXPORT });
      expect(component.saveState()).toEqual({ kind: 'idle' });
    });
  });
});
