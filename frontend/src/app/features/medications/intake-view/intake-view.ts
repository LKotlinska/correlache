import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { DetailHeader } from '../../../components/detail-header/detail-header';
import { HeadacheService } from '../../../services/headache.service';
import { MedicationService } from '../../../services/medication.service';
import { INTAKE_EFFECT_LABELS, MEDICATION_CLASS_LABELS, MEDICATION_USE_LABELS } from '../../../utils/medication';
import { ErrorMessage } from '../../../components/error-message/error-message';

@Component({
  imports: [ErrorMessage, DatePipe, RouterLink, MatCardModule, MatIcon, MatProgressBar, DetailHeader],
  selector: 'app-intake-view',
  styleUrl: './intake-view.scss',
  templateUrl: './intake-view.html',
})
export class IntakeView {
  private medicationService = inject(MedicationService);
  private headacheService = inject(HeadacheService);
  id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  intake = rxResource({
    stream: () => this.medicationService.getIntakeById(this.id),
  });

  /** The headache this dose was taken for, if it was linked to one. */
  headache = rxResource({
    params: () => (this.intake.hasValue() ? { headacheId: this.intake.value().headacheId } : undefined),
    stream: ({ params: { headacheId } }) =>
      headacheId ? this.headacheService.getHeadacheById(headacheId) : of(null),
  });

  readonly classLabels = MEDICATION_CLASS_LABELS;
  readonly useLabels = MEDICATION_USE_LABELS;
  readonly effectLabels = INTAKE_EFFECT_LABELS;

  deleteFn = () => this.medicationService.deleteIntake(this.id);
}
