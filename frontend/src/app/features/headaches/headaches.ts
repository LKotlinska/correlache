import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';


@Component({
  imports: [MatIcon, MatButtonModule, RouterOutlet],
  selector: 'app-headaches',
  styleUrl: './headaches.scss',
  templateUrl: './headaches.html',
})
export class Headaches {
  private location = inject(Location);

  goBack() {
    this.location.back();
  }
}
