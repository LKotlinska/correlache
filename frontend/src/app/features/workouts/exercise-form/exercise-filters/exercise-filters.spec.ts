import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExerciseFilters, ExerciseFiltersData } from './exercise-filters';

describe('ExerciseFilters', () => {
  let component: ExerciseFilters;
  let fixture: ComponentFixture<ExerciseFilters>;

  const data: ExerciseFiltersData = {
    bodyParts: [
      { id: 1, name: 'Back' },
      { id: 2, name: 'Chest' },
    ],
    equipment: [
      { id: 1, name: 'Barbell' },
      { id: 2, name: 'Dumbbell' },
    ],
    selected: { bodyPartIds: [2], equipmentIds: [] },
  };

  beforeEach(async () => {
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

  it('should initialise the selection from dialog data', () => {
    expect(component.result()).toEqual({ bodyPartIds: [2], equipmentIds: [] });
  });

  it('should keep body part and equipment selections separate', () => {
    component.toggle(component.equipmentIds, 1, true);
    component.toggle(component.bodyPartIds, 2, false);
    expect(component.result()).toEqual({ bodyPartIds: [], equipmentIds: [1] });
  });

  it('should clear both sections', () => {
    component.toggle(component.equipmentIds, 2, true);
    component.clear();
    expect(component.result()).toEqual({ bodyPartIds: [], equipmentIds: [] });
  });

  it('should render a chip per option', () => {
    const chips: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-chip-option'));
    expect(chips.map(c => c.textContent?.trim())).toEqual(['Back', 'Chest', 'Barbell', 'Dumbbell']);
  });
});
