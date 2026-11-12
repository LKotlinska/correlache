import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InfoButton } from './info-button';

@Component({
  imports: [InfoButton],
  template: `
    <app-info-button heading="How to do squat" label="How to do squat" compactHeading [content]="body" />
    <ng-template #body><p class="body">Keep your back straight.</p></ng-template>
  `,
})
class Host {}

describe('InfoButton', () => {
  it('names the icon button with its label', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('How to do squat');
  });

  it('opens a dialog with the heading and the given content', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    const dialog = document.querySelector('app-dialog');
    expect(dialog?.textContent).toContain('How to do squat');
    expect(dialog?.querySelector('.body')?.textContent).toContain('Keep your back straight.');
    expect(dialog?.classList).toContain('compact-heading');
  });
});
