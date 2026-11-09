import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExerciseFilters, ExerciseFilterSelection, ExerciseFiltersData } from './exercise-filters';

describe('ExerciseFilters', () => {
  let component: ExerciseFilters;
  let fixture: ComponentFixture<ExerciseFilters>;

  let filters: ReturnType<typeof signal<ExerciseFilterSelection>>;

  beforeEach(async () => {
    filters = signal<ExerciseFilterSelection>({ bodyPartIds: [2], equipmentIds: [] });
    const data: ExerciseFiltersData = {
      bodyParts: [
        { id: 1, name: 'Back' },
        { id: 2, name: 'Chest' },
      ],
      equipment: [
        { id: 1, name: 'Barbell' },
        { id: 2, name: 'Dumbbell' },
      ],
      filters,
    };

    await TestBed.configureTestingModule({
      imports: [ExerciseFilters],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseFilters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should keep the existing selection after the first render', () => {
    expect(filters()).toEqual({ bodyPartIds: [2], equipmentIds: [] });
  });

  it('should write changes straight to the page filters', () => {
    component.toggle('equipmentIds', 1, true);
    component.toggle('bodyPartIds', 2, false);
    expect(filters()).toEqual({ bodyPartIds: [], equipmentIds: [1] });
  });

  it('should clear both sections', () => {
    component.toggle('equipmentIds', 2, true);
    component.clear();
    expect(filters()).toEqual({ bodyPartIds: [], equipmentIds: [] });
  });

  it('should render a chip per option', () => {
    const chips: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-chip-option'));
    expect(chips.map(c => c.textContent?.trim())).toEqual(['Back', 'Chest', 'Barbell', 'Dumbbell']);
  });
});
