import { parseCsv } from './csv';

describe('parseCsv', () => {
  it('splits rows and fields, keeping empty fields', () => {
    expect(parseCsv('a,b,c\n1,,3\n')).toEqual([
      { line: 1, fields: ['a', 'b', 'c'] },
      { line: 2, fields: ['1', '', '3'] },
    ]);
  });

  it('reads quoted fields with commas, doubled quotes and line breaks', () => {
    expect(parseCsv('"Bench, flat","say ""hi""","two\nlines"\nnext,row,here')).toEqual([
      { line: 1, fields: ['Bench, flat', 'say "hi"', 'two\nlines'] },
      { line: 3, fields: ['next', 'row', 'here'] },
    ]);
  });

  it('accepts CRLF line endings and a byte order mark', () => {
    expect(parseCsv('﻿a,b\r\n1,2\r\n')).toEqual([
      { line: 1, fields: ['a', 'b'] },
      { line: 2, fields: ['1', '2'] },
    ]);
  });

  it('skips blank lines but keeps line numbers', () => {
    expect(parseCsv('a\n\n  \nb')).toEqual([
      { line: 1, fields: ['a'] },
      { line: 4, fields: ['b'] },
    ]);
  });

  it('reads a last row without a trailing newline', () => {
    expect(parseCsv('a,b')).toEqual([{ line: 1, fields: ['a', 'b'] }]);
  });
});
