import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { injectGoBack } from '../../utils/go-back';

@Component({
  imports: [MatButtonModule, MatIcon],
  selector: 'app-page-header',
  styleUrl: './page-header.scss',
  templateUrl: './page-header.html',
})
export class PageHeader {
  private back = injectGoBack();

  title = input.required<string>();
  /** Where back goes when there is no in-app history; a relative path resolves against the current route. */
  fallback = input('/user/diary');

  goBack() {
    this.back(this.fallback());
  }
}
