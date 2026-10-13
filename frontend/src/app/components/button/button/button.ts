import { Component, input } from '@angular/core';
import { MatButton, MatButtonAppearance } from '@angular/material/button';

@Component({
  imports: [MatButton],
  selector: 'app-button',
  styleUrl: './button.scss',
  templateUrl: './button.html',
})
export class Button {
  label = input<string>();
  type = input<string>('button');
  appearance = input<MatButtonAppearance>('filled');
  isFullWidth = input<boolean>(false);
}
