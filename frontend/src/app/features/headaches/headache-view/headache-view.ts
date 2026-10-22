import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute } from '@angular/router';
import { PageHeader } from '../../../components/page-header/page-header';
import { ChipList } from '../../../components/chip-list/chip-list';
import { MediaTile } from '../../../components/form-fields/media-tile/media-tile';
import { HeadacheService } from '../../../services/headache.service';

@Component({
  imports: [DatePipe, MatCardModule, MatExpansionModule, MatIcon, MatProgressBar, ChipList, MediaTile, MatButtonModule, MatMenuModule, PageHeader],
  selector: 'app-headache-view',
  styleUrl: './headache-view.scss',
  templateUrl: './headache-view.html',
})
export class HeadacheView {
  private headacheService = inject(HeadacheService);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  headache = rxResource({
    stream: () => this.headacheService.getHeadacheById(this.id),
  });
}
