import {
  parseClock,
  parseLocalDateTime,
  parseNumber,
  parseWholeNumber,
  requireText,
  RowError,
  toKilograms,
  toKilometres,
} from './parse-values';

describe('parseNumber', () => {
  it('reads blank and "null" as no value', () => {
    expect(parseNumber('', 'Weight')).toBeNull();
    expect(parseNumber('null', 'Weight')).toBeNull();
  });

  it('reads decimals', () => {
    expect(parseNumber('26.250', 'Weight')).toBe(26.25);
  });

  it.each(['heavy', '-5', 'Infinity'])('rejects %s', (value) => {
    expect(() => parseNumber(value, 'Weight')).toThrow(RowError);
  });
});

describe('parseWholeNumber', () => {
  it('rejects fractions', () => {
    expect(parseWholeNumber('12', 'Reps')).toBe(12);
    expect(() => parseWholeNumber('7.5', 'Reps')).toThrow('Reps "7.5" is not a whole number.');
  });
});

describe('parseClock', () => {
  it.each([
    ['0:50', 50],
    ['27:00', 27 * 60],
    ['01:08:27', 3600 + 8 * 60 + 27],
  ])('reads %s as %i seconds', (value, seconds) => {
    expect(parseClock(value, 'Time')).toBe(seconds);
  });

  it('reads blank as no value', () => {
    expect(parseClock('', 'Time')).toBeNull();
  });

  it.each(['1:75', '90', '1:5', '1:00:00:00', 'a:00'])('rejects %s', (value) => {
    expect(() => parseClock(value, 'Time')).toThrow(RowError);
  });
});

describe('parseLocalDateTime', () => {
  it('returns an ISO local time', () => {
    expect(parseLocalDateTime('2026-11-09 10:53:09', 'Date')).toBe('2026-11-09T10:53:09');
  });

  it.each(['10/08/2026', '2026-11-09', '2026-11-09 24:00:00', '2026-13-01 10:00:00'])(
    'rejects the format %s',
    (value) => {
      expect(() => parseLocalDateTime(value, 'Date')).toThrow('is not a date and time like');
    },
  );

  it('rejects days the month does not have', () => {
    expect(() => parseLocalDateTime('2026-02-30 10:00:00', 'Date')).toThrow('is not a real date.');
    expect(parseLocalDateTime('2028-02-29 10:00:00', 'Date')).toBe('2028-02-29T10:00:00');
  });
});

describe('requireText', () => {
  it('rejects blank values with the label', () => {
    expect(() => requireText('', 'workout title')).toThrow('The workout title is missing.');
  });
});

describe('unit conversion', () => {
  it('converts pounds and miles, rounding', () => {
    expect(toKilograms(8.75, 'lb')).toBe(3.97);
    expect(toKilometres(3.15, 'mi')).toBe(5.069);
  });

  it('leaves kilograms, kilometres and missing values alone', () => {
    expect(toKilograms(26.25, 'kg')).toBe(26.25);
    expect(toKilometres(3.15, 'km')).toBe(3.15);
    expect(toKilograms(null, 'lb')).toBeNull();
  });
});
