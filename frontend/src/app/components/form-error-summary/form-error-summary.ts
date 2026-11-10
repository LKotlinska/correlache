import { afterNextRender, Component, ElementRef, inject, Injector, input } from '@angular/core';

export interface FormProblem {
  /** Plain-language problem, e.g. "Medication 2: choose a medication". */
  message: string;
  /** Id of the element around the field; the summary scrolls to it and focuses its first control. */
  target: string;
  /** Runs before jumping, to show a field that is hidden, e.g. by opening its step or panel. */
  reveal?: () => void;
}

/** Lets an opening step or panel finish its animation before its field can be focused. */
const REVEAL_DELAY_MS = 300;
const FOCUSABLE = 'input, textarea, mat-select, button, [tabindex]:not([tabindex="-1"])';

/**
 * Lists a form's problems after a failed save, each one a button that jumps to its field.
 * Render it only while there are problems to show: it scrolls itself into view when it appears.
 */
@Component({
  selector: 'app-form-error-summary',
  styleUrl: './form-error-summary.scss',
  templateUrl: './form-error-summary.html',
})
export class FormErrorSummary {
  private injector = inject(Injector);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  problems = input.required<FormProblem[]>();

  constructor() {
    afterNextRender(() => {
      const box = this.host.nativeElement.querySelector<HTMLElement>('.error-summary');
      box?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      box?.focus({ preventScroll: true });
    });
  }

  goTo(problem: FormProblem) {
    problem.reveal?.();
    afterNextRender(
      () => {
        const focus = () => {
          const target = document.getElementById(problem.target);
          if (!target) return;
          target.scrollIntoView({ block: 'center', behavior: 'smooth' });
          const control = target.matches(FOCUSABLE) ? target : target.querySelector<HTMLElement>(FOCUSABLE);
          control?.focus({ preventScroll: true });
        };
        if (problem.reveal) setTimeout(focus, REVEAL_DELAY_MS);
        else focus();
      },
      { injector: this.injector },
    );
  }
}
