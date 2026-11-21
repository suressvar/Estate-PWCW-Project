export type CsvValue = string | number | null | undefined;

/** Preserve field boundaries and render untrusted formula-like text as spreadsheet text. */
export function csvCell(value: CsvValue): string {
  let text = value == null ? '' : String(value);
  const unsafe = typeof value === 'string' && (/^[\s\uFEFF]*[=+\-@＝＋－＠]/u.test(text) || /^[\t\r\n]/u.test(text));
  if (unsafe) text = `\t${text}`;
  return unsafe || /[",\r\n]/u.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvDocument(headers: readonly string[], rows: readonly (readonly CsvValue[])[]): string {
  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
}

export function csvDataUri(csv: string): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}
