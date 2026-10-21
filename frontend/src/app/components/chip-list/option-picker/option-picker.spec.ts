import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OptionPicker, OptionPickerData } from './option-picker';

describe('OptionPicker', () => {
  let component: OptionPicker;
  let fixture: ComponentFixture<OptionPicker>;

  const data: OptionPickerData = {
    heading: 'Triggers',
    options: [
      { id: 1, name: 'Stress' },
      { id: 2, name: 'Caffeine' },
      { id: 3, name: 'Lack of sleep' },
    ],
    selected: [2],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionPicker],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OptionPicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialise selected from dialog data', () => {
    expect(component.selected()).toEqual([2]);
  });

  describe('toggle', () => {
    it('should add an id when selected', () => {
      component.toggle(1, true);
      expect(component.selected()).toEqual([2, 1]);
    });

    it('should remove an id when deselected', () => {
      component.toggle(2, false);
      expect(component.selected()).toEqual([]);
    });

    it('should leave other ids untouched when deselecting', () => {
      component.toggle(3, true);
      component.toggle(2, false);
      expect(component.selected()).toEqual([3]);
    });
  });

  describe('template', () => {
    const chips = (): HTMLElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll('mat-chip-option'));

    it('should render the heading', () => {
      expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Triggers');
    });

    it('should render a chip per option', () => {
      expect(chips().map(c => c.textContent?.trim())).toEqual([
        'Stress',
        'Caffeine',
        'Lack of sleep',
      ]);
    });

    it('should mark initially selected options', () => {
      const selected = chips().map(c => c.classList.contains('mdc-evolution-chip--selected'));
      expect(selected).toEqual([false, true, false]);
    });

    it('should update selected when a chip is clicked', async () => {
      chips()[0].querySelector<HTMLElement>('button')!.click();
      await fixture.whenStable();
      expect(component.selected()).toEqual([2, 1]);
    });

    it('should deselect a chip when clicked again', async () => {
      chips()[1].querySelector<HTMLElement>('button')!.click();
      await fixture.whenStable();
      expect(component.selected()).toEqual([]);
    });

    it('should have a Done button', () => {
      const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
      expect(buttons.some(b => b.textContent?.trim() === 'Done')).toBe(true);
    });
  });
});
