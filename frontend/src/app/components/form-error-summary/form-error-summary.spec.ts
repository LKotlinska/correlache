import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FormErrorSummary } from './form-error-summary';

describe('FormErrorSummary', () => {
  let fixture: ComponentFixture<FormErrorSummary>;
  const reveal = vi.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormErrorSummary] }).compileComponents();
    fixture = TestBed.createComponent(FormErrorSummary);
    fixture.componentRef.setInput('problems', [
      { message: 'Start is required', target: 'start' },
      { message: 'Medication 1: choose a medication', target: 'intake-0-medication', reveal },
    ]);
    await fixture.whenStable();
  });

  it('lists every problem as a button', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')].map((b: HTMLElement) => b.textContent?.trim());
    expect(buttons).toEqual(['Start is required', 'Medication 1: choose a medication']);
    expect(fixture.nativeElement.querySelector('.heading').textContent).toContain('Fix these');
  });

  it('reveals a hidden field before jumping to it', () => {
    fixture.nativeElement.querySelectorAll('button')[1].click();
    expect(reveal).toHaveBeenCalled();
  });
});
