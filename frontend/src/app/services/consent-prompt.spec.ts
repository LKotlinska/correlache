import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, Subject } from 'rxjs';
import { ConsentPrompt } from './consent-prompt';

describe('ConsentPrompt', () => {
  let closed: Subject<string | undefined>;
  const dialog = { open: vi.fn() };
  let prompt: ConsentPrompt;

  beforeEach(() => {
    vi.resetAllMocks();
    closed = new Subject();
    dialog.open.mockReturnValue({ afterClosed: () => closed });
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: dialog }] });
    prompt = TestBed.inject(ConsentPrompt);
  });

  const close = (result: string) => {
    closed.next(result);
    closed.complete();
  };

  it('opens one dialog for callers that ask while it is open, and shares the answer', async () => {
    const first = firstValueFrom(prompt.ask());
    const second = firstValueFrom(prompt.ask());
    close('consented');

    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(dialog.open).toHaveBeenCalledWith(expect.anything(), { disableClose: true, closeOnNavigation: false });
  });

  it('answers false when the user left instead of consenting', async () => {
    const answer = firstValueFrom(prompt.ask());
    close('left');

    await expect(answer).resolves.toBe(false);
  });

  it('opens a new dialog once the previous one has closed', async () => {
    const answer = firstValueFrom(prompt.ask());
    close('left');
    await answer;

    closed = new Subject();
    dialog.open.mockReturnValue({ afterClosed: () => closed });
    prompt.ask();

    expect(dialog.open).toHaveBeenCalledTimes(2);
  });
});
