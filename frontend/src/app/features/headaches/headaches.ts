import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';


@Component({
  imports: [MatIcon, MatButtonModule, RouterOutlet],
  selector: 'app-headaches',
  styleUrl: './headaches.scss',
  templateUrl: './headaches.html',
})
export class Headaches {}
