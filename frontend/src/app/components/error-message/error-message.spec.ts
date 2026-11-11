import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorMessage } from './error-message';

describe('ErrorMessage', () => {
  let fixture: ComponentFixture<ErrorMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ErrorMessage] }).compileComponents();
    fixture = TestBed.createComponent(ErrorMessage);
    fixture.componentRef.setInput('message', "Couldn't load.");
  });

  it('shows the message without a button by default', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain("Couldn't load.");
    expect(el.querySelector('button')).toBeNull();
  });

  it('emits retry when "Try again" is clicked', () => {
    fixture.componentRef.setInput('retryable', true);
    let retried = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    expect(retried).toBe(true);
  });
});
