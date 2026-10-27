import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { DraftStorage } from '../../../services/draft-storage';
import { AbstractControl, FormGroup,ɵInternalFormsSharedModule, ReactiveFormsModule, FormsModule, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepperModule } from '@angular/material/stepper';
import { HeadacheService } from '../../../services/headache.service';
import { AsyncPipe } from '@angular/common';
import { MediaTile } from '../../../components/form-fields/media-tile/media-tile';
import { ChipList } from '../../../components/chip-list/chip-list';
import { DateTimePicker } from '../../../components/form-fields/date-time-picker/date-time-picker';
import { PageHeader } from '../../../components/page-header/page-header';
import { Button } from '../../../components/button/button';
import { combineDateTime } from '../../../utils/combine-date-time';
import { CreateHeadachePayload } from '../../../models/headache.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { HeadacheDetail } from '../../../models/headache.model';

const DRAFT_KEY = 'headache-draft';

@Component({
  imports: [
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    AsyncPipe,
    MediaTile,
    ChipList,
    Button,
    PageHeader,
    DateTimePicker
],
  selector: 'app-headache-form',
  styleUrl: './headache-form.scss',
  templateUrl: './headache-form.html',
})
export class HeadacheForm {
  private headacheService = inject(HeadacheService);
  private snackBar = inject(MatSnackBar); // temporary snackbar
  private router = inject(Router);
  private draftStorage = inject(DraftStorage);
  /** Set on the edit route (`:id/edit`); null when adding a new headache. */
  private headacheId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  isEdit = this.headacheId !== null;
  options = this.headacheService.getOptions();
  isSubmitting = signal(false);
  /** Latest selectable date: headaches can't be logged in the future. */
  today = new Date();

  headacheForm = new FormGroup({
    startDate: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    startTime: new FormControl<Date | null>(new Date(), { validators: [Validators.required]}),
    endDate: new FormControl<Date | null>(null),
    endTime: new FormControl<Date | null>(null),
    painLevel: new FormControl<number>(1, { validators: [Validators.required], nonNullable: true }),
    locationIds: new FormControl<number[]>([], { nonNullable: true }),
    triggerIds: new FormControl<number[]>([], { nonNullable: true }),
    symptomIds: new FormControl<number[]>([], { nonNullable: true }),
    reliefIds: new FormControl<number[]>([], { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true })
  }, { validators: [
    (group: AbstractControl) => this.endNotBeforeStart(group),
    (group: AbstractControl) => this.notInFuture(group),
  ] })

  constructor() {
    if (this.headacheId) {
      this.headacheService.getHeadacheById(this.headacheId).subscribe({
        next: (headache) => this.fillForm(headache),
        error: () => this.snackBar.open("Couldn't load this headache", 'Close', { panelClass: 'snackbar-error' }),
      });
      return;
    }
    // New headaches keep a draft in sessionStorage; editing is prefilled from the server instead
    const draft = this.draftStorage.load<Record<string, unknown>>(DRAFT_KEY);
    if (draft) {
      this.restored = true;
      this.headacheForm.patchValue(draft);
    }
    this.headacheForm.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe(() => {
        if (this.submitted) return;
        this.restored = true; // from here on a draft exists in storage
        this.draftStorage.save(DRAFT_KEY, this.headacheForm.getRawValue());
      });
  }

  private submitted = false;
  /** True once a draft exists in storage, whether restored or saved from an edit. */
  private restored = false;

  hasDraft() {
    return !this.headacheId && !this.submitted && this.restored;
  }

  discardDraft() {
    this.draftStorage.clear(DRAFT_KEY);
  }

  /** Pre-fills the form with an existing headache so it can be edited. */
  private fillForm(h: HeadacheDetail) {
    const started = new Date(h.startedAt);
    const ended = h.endedAt ? new Date(h.endedAt) : null;
    this.headacheForm.patchValue({
      startDate: started,
      startTime: started,
      endDate: ended,
      endTime: ended,
      painLevel: h.painLevel,
      notes: h.notes ?? '',
      locationIds: h.locations.map((o) => o.id),
      triggerIds: h.triggers.map((o) => o.id),
      symptomIds: h.symptoms.map((o) => o.id),
      reliefIds: h.reliefMeasures.map((o) => o.id),
    });
  }

  /** Group validator: neither the start nor the end datetime may be in the future (the date picker only blocks future days, not later times today). */
  private notInFuture(group: AbstractControl): ValidationErrors | null {
    const startDate: Date | null = group.get('startDate')?.value ?? null;
    const startTime: Date | null = group.get('startTime')?.value ?? null;
    const endDate: Date | null = group.get('endDate')?.value ?? null;
    const endTime: Date | null = group.get('endTime')?.value ?? null;
    if (!startDate || !startTime) {
      return null;
    }
    const { startedAt, endedAt } = this.buildTimestamps(startDate, startTime, endDate, endTime);
    const now = Date.now();
    return new Date(startedAt).getTime() > now || (endedAt && new Date(endedAt).getTime() > now) ? { futureDate: true } : null;
  }

  /** Group validator: the combined end datetime must not be before the combined start datetime. */
  private endNotBeforeStart(group: AbstractControl): ValidationErrors | null {
    const startDate: Date | null = group.get('startDate')?.value ?? null;
    const startTime: Date | null = group.get('startTime')?.value ?? null;
    const endDate: Date | null = group.get('endDate')?.value ?? null;
    const endTime: Date | null = group.get('endTime')?.value ?? null;
    if (!startDate || !startTime) {
      return null;
    }
    const { startedAt, endedAt } = this.buildTimestamps(startDate, startTime, endDate, endTime);
    // Angular validators return null when valid, or an error object when invalid.
    // Invalid here is an end datetime exists and is earlier than the start datetime.
    return endedAt && new Date(endedAt) < new Date(startedAt) ? { endBeforeStart: true } : null;
  }

  /** Combines the date and time controls into ISO strings. A same-day end with no end time uses the start time, not midnight. */
  private buildTimestamps(startDate: Date, startTime: Date | null, endDate: Date | null, endTime: Date | null) {
    const startedAt = combineDateTime(startDate, startTime);
    if (!endDate) {
      return { startedAt, endedAt: undefined };
    }
    const resolvedEndTime = !endTime && this.isSameDay(startDate, endDate) ? startTime : endTime;
    return { startedAt, endedAt: combineDateTime(endDate, resolvedEndTime) };
  }

  isSelected(id: number) {
    return this.headacheForm.controls.locationIds.value.includes(id);
  }

  toggleLocation(id: number, checked: boolean) {
    const control = this.headacheForm.controls.locationIds;
    const currentIds = control.value;

    if (checked) {
      // Add ids when selected
      control.setValue([...currentIds, id]);
    } else {
      // Remove this id when unselected
      control.setValue(currentIds.filter(x => x !== id));
    }
  }

  /** Earliest selectable end time: the start time, but only when both fall on the same day. */
  get endTimeMin(): Date | null {
    const { startDate, startTime, endDate } = this.headacheForm.controls;
    if (startDate.value && endDate.value && startTime.value && this.isSameDay(startDate.value, endDate.value)) {
      return startTime.value;
    }
    return null;
  }

  /** Latest selectable start time: now, but only when the start date is today. */
  get startTimeMax(): Date | null {
    return this.maxTimeFor(this.headacheForm.controls.startDate.value);
  }

  /** Latest selectable end time: now, but only when the end date is today. */
  get endTimeMax(): Date | null {
    return this.maxTimeFor(this.headacheForm.controls.endDate.value);
  }

  private maxTimeFor(date: Date | null): Date | null {
    const now = new Date();
    return date && this.isSameDay(date, now) ? now : null;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  endDateFilter = (d: Date | null): boolean => {
    // Prevent end date from traveling back in time.
    const start = this.headacheForm.controls.startDate.value;
    if (d === null) {
      return false;
    }
    if (!start) {
      return true;
    }
    // Compare by calendar day so the same day stays selectable.
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return day >= startDay;
  };

  onSubmit() {
    if (this.isSubmitting()) {
      return;
    }
    if (this.headacheForm.invalid) { 
      this.headacheForm.markAllAsTouched(); 
      return; 
    }
    const { startDate, startTime, endDate, endTime, ...fields} = this.headacheForm.getRawValue();

    const payload: CreateHeadachePayload = {
      ...fields,
      ...this.buildTimestamps(startDate!, startTime, endDate, endTime),
    };

    this.isSubmitting.set(true);
    const request = this.headacheId
      ? this.headacheService.update(this.headacheId, payload)
      : this.headacheService.create(payload);
    request.subscribe({
      next: () => {
        this.submitted = true;
        this.discardDraft();
        if (this.headacheId) {
          this.router.navigate(['/user/headache', this.headacheId], { replaceUrl: true });
          return;
        }
        // Temporary snackbar - should redirect to headache view
        this.snackBar.open('Headache has been added', 'Close', { panelClass: 'snackbar-success',});
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        // Temporary error - should show in component
        const message = err.error?.message;
        this.snackBar.open((Array.isArray(message) ? message[0] : message) ?? 'Something went wrong', 'Close', { panelClass: 'snackbar-error' });
      }
    });
  }
}
