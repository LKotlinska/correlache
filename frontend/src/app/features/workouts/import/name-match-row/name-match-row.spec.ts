import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Exercise } from '../../../../models/workout.model';
import { NameMatch } from '../exercise-matching';
import { NameChoice } from '../import-plan';
import { NameMatchRow } from './name-match-row';

const exercise = (id: number, name: string): Exercise => ({
  id,
  name,
  imageName: null,
  gifName: null,
  equipment: { id: 1, name: 'dumbbell' },
  bodyPart: { id: 1, name: 'chest' },
  muscles: [],
});

const dumbbellPress = exercise(1, 'dumbbell incline bench press');
const barbellPress = exercise(2, 'barbell incline bench press');
const curl = exercise(3, 'dumbbell biceps curl');

describe('NameMatchRow', () => {
  let fixture: ComponentFixture<NameMatchRow>;

  const render = async (row: NameMatch, choice?: NameChoice) => {
    fixture.componentRef.setInput('row', row);
    fixture.componentRef.setInput('choice', choice);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const buttons = (element: HTMLElement) =>
    [...element.querySelectorAll('.actions button')].map((b) => b.textContent?.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NameMatchRow] });
    fixture = TestBed.createComponent(NameMatchRow);
  });

  it('offers the suggestions as radio buttons and reports the pick', async () => {
    const element = await render({
      name: 'Incline Bench Press',
      setCount: 6,
      match: { kind: 'choose', options: [dumbbellPress, barbellPress] },
    });
    const picked = vi.fn();
    fixture.componentInstance.picked.subscribe(picked);

    expect(element.querySelectorAll('mat-radio-button')).toHaveLength(2);
    element.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].click();
    expect(picked).toHaveBeenCalledWith(barbellPress);
  });

  it('asks for a choice when nothing matches', async () => {
    const element = await render({ name: 'Hip Thrust', setCount: 3, match: { kind: 'unmatched' } });
    expect(element.textContent).toContain('No exercise here has this name.');
    expect(buttons(element)).toEqual(['search Choose exercise', 'Skip']);
  });

  it('shows a skip and how to undo it', async () => {
    const element = await render(
      { name: 'Hip Thrust', setCount: 3, match: { kind: 'unmatched' } },
      { kind: 'skip' },
    );
    expect(element.textContent).toContain("Skipped. Its sets won't be imported.");
    expect(buttons(element)).toEqual(['search Choose exercise', 'Undo skip']);
  });

  it('shows an automatic match, and offers it back once replaced', async () => {
    const row: NameMatch = {
      name: 'Biceps Curl',
      setCount: 3,
      match: { kind: 'matched', exercise: curl },
    };
    let element = await render(row, { kind: 'exercise', exercise: curl });
    expect(element.querySelector('.outcome')?.textContent).toContain('dumbbell biceps curl');
    expect(buttons(element)).toEqual(['search Search exercises', 'Skip']);

    element = await render(row, { kind: 'exercise', exercise: dumbbellPress });
    expect(element.querySelector('.outcome')?.textContent).toContain(
      'dumbbell incline bench press',
    );
    expect(buttons(element)).toContain('Use automatic match');
  });
});
