import { Component, inject } from '@angular/core';
import { HeadacheService } from '../../services/headache.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ListItem } from '../../components/list-item/list-item';

@Component({
  imports: [ListItem],
  selector: 'app-diary',
  styleUrl: './diary.scss',
  templateUrl: './diary.html',
})
export class Diary {
  private headacheService = inject(HeadacheService)

  headaches = rxResource({
    stream: () => this.headacheService.getHeadaches(),
  });
}
