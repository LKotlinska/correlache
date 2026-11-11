export interface CsvRow {
  /** 1-based line in the file where the row starts, for error messages */
  line: number;
  fields: string[];
}

/**
 * Splits CSV text into rows (RFC 4180): quoted fields may contain commas, doubled quotes and
 * line breaks. Accepts \n and \r\n line endings, drops a leading byte order mark and skips blank lines.
 */
export function parseCsv(text: string): CsvRow[] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: CsvRow[] = [];
  let fields: string[] = [];
  let field = '';
  let quoted = false;
  let line = 1;
  let rowStart = 1;

  const endRow = () => {
    fields.push(field);
    if (fields.length > 1 || fields[0].trim() !== '') rows.push({ line: rowStart, fields });
    fields = [];
    field = '';
    rowStart = line;
  };

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        if (c === '\n') line++;
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      fields.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i++;
      line++;
      endRow();
    } else {
      field += c;
    }
  }
  if (field !== '' || fields.length > 0) endRow();
  return rows;
}
