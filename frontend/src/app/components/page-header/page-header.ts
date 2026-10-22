import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [MatButtonModule, MatIcon],
  selector: 'app-page-header',
  styleUrl: './page-header.scss',
  templateUrl: './page-header.html',
})
export class PageHeader {
  private location = inject(Location);

  title = input.required<string>();

  goBack() {
    this.location.back();
  }
}
