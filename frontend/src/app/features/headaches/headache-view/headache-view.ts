import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DetailHeader } from '../../../components/detail-header/detail-header';
import { ChipList } from '../../../components/chip-list/chip-list';
import { MediaTile } from '../../../components/form-fields/media-tile/media-tile';
import { HeadacheService } from '../../../services/headache.service';
import { matchPattern, PATTERN_NAMES, patternLabel } from '../../../utils/headache-patterns';
import { INTAKE_EFFECT_LABELS, intakeLabel } from '../../../utils/medication';
import { ErrorMessage } from '../../../components/error-message/error-message';

@Component({
  imports: [ErrorMessage, DatePipe, RouterLink, MatCardModule, MatIcon, MatProgressBar, ChipList, MediaTile, DetailHeader],
  selector: 'app-headache-view',
  styleUrl: './headache-view.scss',
  templateUrl: './headache-view.html',
})
export class HeadacheView {
  private headacheService = inject(HeadacheService);
  id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  headache = rxResource({
    stream: () => this.headacheService.getHeadacheById(this.id),
  });

  /** Which headache pattern this one resembles, from what was logged. */
  pattern = computed(() => (this.headache.hasValue() ? matchPattern(this.headache.value()) : null));

  readonly patternLabel = patternLabel;
  readonly patternNames = PATTERN_NAMES;
  readonly intakeLabel = intakeLabel;
  readonly effectLabels = INTAKE_EFFECT_LABELS;

  deleteFn = () => this.headacheService.delete(this.id);
}
