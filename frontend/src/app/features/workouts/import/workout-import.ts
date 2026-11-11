import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { DialogService } from '../../../components/dialog/dialog.service';
import { ErrorMessage } from '../../../components/error-message/error-message';
import { PageHeader } from '../../../components/page-header/page-header';
import { Exercise } from '../../../models/workout.model';
import { WorkoutService } from '../../../services/workout.service';
import { matchExerciseNames, NameMatch } from './exercise-matching';
import {
  ExercisePickerData,
  ExercisePickerDialog,
} from './exercise-picker-dialog/exercise-picker-dialog';
import { DistanceUnit, ImportFormatError, ImportParseResult, WeightUnit } from './imported-workout';
import {
  buildWorkoutPayloads,
  initialChoices,
  NameChoice,
  NameChoices,
  summarise,
  undecidedNames,
} from './import-plan';
import { parseLyftaCsv } from './lyfta';
import { NameMatchRow } from './name-match-row/name-match-row';

type ParseOutcome = { ok: true; result: ImportParseResult } | { ok: false; message: string };

/**
 * Reads a Lyfta CSV export in the browser, shows what is in it, and lets the user match each exported
 * exercise name to the library or skip it. Nothing is sent to the server on this page.
 */
@Component({
  imports: [
    DatePipe,
    ErrorMessage,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCheckbox,
    MatIcon,
    MatProgressBar,
    NameMatchRow,
    NgTemplateOutlet,
    PageHeader,
  ],
  selector: 'app-workout-import',
  styleUrl: './workout-import.scss',
  templateUrl: './workout-import.html',
})
export class WorkoutImport {
  private workoutService = inject(WorkoutService);
  private dialogService = inject(DialogService);

  readonly file = signal<{ name: string; text: string } | null>(null);
  readonly weightUnit = signal<WeightUnit>('kg');
  readonly distanceUnit = signal<DistanceUnit>('km');
  readonly includeWarmups = signal(true);

  readonly library = rxResource({ stream: () => this.workoutService.getExercises() });

  /** Re-read whenever the file or the units change */
  readonly parsed = computed<ParseOutcome | null>(() => {
    const file = this.file();
    if (!file) return null;
    try {
      const units = { weight: this.weightUnit(), distance: this.distanceUnit() };
      return { ok: true, result: parseLyftaCsv(file.text, units) };
    } catch (error) {
      if (error instanceof ImportFormatError) return { ok: false, message: error.message };
      throw error;
    }
  });

  private readonly workouts = computed(() => {
    const parsed = this.parsed();
    return parsed?.ok ? parsed.result.workouts : [];
  });

  readonly summary = computed(() => summarise(this.workouts()));

  readonly matches = computed(() =>
    matchExerciseNames(this.workouts(), this.library.value() ?? []),
  );
  /** Names the user has to look at: those without a single automatic match */
  readonly toReview = computed(() => this.matches().filter((m) => m.match.kind !== 'matched'));
  readonly autoMatched = computed(() => this.matches().filter((m) => m.match.kind === 'matched'));

  /** The user's decisions. Kept for names still in the file when it is re-read. */
  readonly choices = linkedSignal<NameMatch[], NameChoices>({
    source: this.matches,
    computation: (matches, previous) => initialChoices(matches, previous?.value),
  });
  readonly undecided = computed(() => undecidedNames(this.matches(), this.choices()));

  /** What will be imported, once every name is decided */
  readonly payloads = computed(() =>
    this.undecided().length > 0
      ? null
      : buildWorkoutPayloads(this.workouts(), this.choices(), {
          includeWarmups: this.includeWarmups(),
        }),
  );
  readonly payloadSets = computed(() =>
    (this.payloads() ?? []).reduce(
      (total, workout) =>
        total + workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0),
      0,
    ),
  );

  async selectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Cleared so picking the same file again still fires a change
    input.value = '';
    if (!file) return;
    this.file.set({ name: file.name, text: await file.text() });
  }

  choose(name: string, exercise: Exercise) {
    this.setChoice(name, { kind: 'exercise', exercise });
  }

  search(row: NameMatch) {
    const data: ExercisePickerData = {
      exportedName: row.name,
      library: this.library.value() ?? [],
    };
    this.dialogService
      .open(ExercisePickerDialog, data)
      .afterClosed()
      .subscribe((exercise?: Exercise) => {
        if (exercise) this.choose(row.name, exercise);
      });
  }

  skip(name: string) {
    this.setChoice(name, { kind: 'skip' });
  }

  /** Back to undecided, or to the automatic match */
  reset(row: NameMatch) {
    this.setChoice(
      row.name,
      row.match.kind === 'matched' ? { kind: 'exercise', exercise: row.match.exercise } : null,
    );
  }

  private setChoice(name: string, choice: NameChoice | null) {
    this.choices.update((choices) => {
      const next = new Map(choices);
      if (choice) next.set(name, choice);
      else next.delete(name);
      return next;
    });
  }
}
