import { Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatRadioButton, MatRadioChange, MatRadioGroup } from '@angular/material/radio';
import { Exercise } from '../../../../models/workout.model';
import { NameMatch } from '../exercise-matching';
import { NameChoice } from '../import-plan';

/** One exported exercise name on the import screen: what it will be imported as, and how to change that. */
@Component({
  imports: [MatButton, MatIcon, MatRadioButton, MatRadioGroup],
  selector: 'app-name-match-row',
  styleUrl: './name-match-row.scss',
  templateUrl: './name-match-row.html',
})
export class NameMatchRow {
  row = input.required<NameMatch>();
  /** Undefined while the user has not decided */
  choice = input<NameChoice>();

  picked = output<Exercise>();
  searchRequested = output<void>();
  skipped = output<void>();
  /** Undo a skip, or go back to the automatic match */
  resetRequested = output<void>();

  /** Equally good candidates, offered as radio buttons */
  readonly suggestions = computed(() => {
    const { match } = this.row();
    return match.kind === 'choose' ? match.options : [];
  });

  readonly chosen = computed(() => {
    const choice = this.choice();
    return choice?.kind === 'exercise' ? choice.exercise : null;
  });

  readonly isSkipped = computed(() => this.choice()?.kind === 'skip');

  /** The choice is spelled out unless the checked radio button already shows it */
  readonly showChosen = computed(() => {
    const chosen = this.chosen();
    return chosen !== null && !this.suggestions().some((option) => option.id === chosen.id);
  });

  /** An automatic match the user replaced with another exercise */
  readonly isChangedFromAutomatic = computed(() => {
    const { match } = this.row();
    const chosen = this.chosen();
    return match.kind === 'matched' && chosen !== null && chosen.id !== match.exercise.id;
  });

  readonly isUnmatched = computed(() => this.row().match.kind === 'unmatched');

  pickSuggestion(change: MatRadioChange<number>) {
    const exercise = this.suggestions().find((option) => option.id === change.value);
    if (exercise) this.picked.emit(exercise);
  }
}
