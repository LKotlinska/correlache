import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [MatIconModule, MatButtonModule, MatDialogModule],
  selector: 'app-dialog-header',
  styleUrl: './dialog-header.scss',
  templateUrl: './dialog-header.html',
})
export class DialogHeader {
  heading = input.required<string>();
}
