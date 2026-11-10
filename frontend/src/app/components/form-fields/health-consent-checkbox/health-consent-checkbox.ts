import { Component, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DialogService } from '../../dialog/dialog.service';

/**
 * The explicit consent to processing health data (GDPR art. 9(2)(a)), shared by signup and the
 * consent prompt so both ask with the same wording.
 */
@Component({
  selector: 'app-health-consent-checkbox',
  templateUrl: './health-consent-checkbox.html',
  imports: [ReactiveFormsModule, MatCheckboxModule],
})
export class HealthConsentCheckbox {
  private dialogService = inject(DialogService);

  control = input.required<FormControl<boolean | null>>();
  /** Shown below the checkbox once it is touched and still unticked. */
  errorMessage = input.required<string>();

  get invalid() {
    return this.control().invalid && this.control().touched;
  }

  /** Opens on top, so the form underneath keeps what was filled in. */
  openPrivacyPolicy(event: Event) {
    // Stops the click from also toggling the checkbox the link sits in
    event.preventDefault();
    this.dialogService.open('privacy');
  }
}
