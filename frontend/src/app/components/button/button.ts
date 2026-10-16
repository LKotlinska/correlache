import { Component, input } from '@angular/core';
import { MatButton, MatButtonAppearance } from '@angular/material/button';

export type ButtonType = 'button' | 'submit' | 'reset';
@Component({
  imports: [MatButton],
  selector: 'app-button',
  styleUrl: './button.scss',
  templateUrl: './button.html',
})
export class Button {
  type = input<ButtonType>('button');
  appearance = input<MatButtonAppearance>('filled');
  isFullWidth = input<boolean>(false);
  disabled = input<boolean>(false);
}
