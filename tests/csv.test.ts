import { describe, expect, it } from 'vitest';
import { csvCell, csvDocument, csvDataUri } from '../src/lib/csv';

describe('CSV export safety and data fidelity', () => {
  it.each(['=1+1', '+1+1', '-1+1', '@SUM(1)', '  =1+1', '\t=1+1', '\r=1+1', '\n=1+1', '＝1+1', '＋1+1', '－1+1', '＠SUM(1)'])('exports formula-like text as a quoted literal: %j', value => {
    const result = csvCell(value);
    expect(result.startsWith('"\t')).toBe(true);
    expect(result.endsWith('"')).toBe(true);
  });
  it('escapes delimiters, quotes and embedded newlines without creating extra cells', () => {
    expect(csvCell('Tea, "green"\nதமிழ்')).toBe('"Tea, ""green""\nதமிழ்"');
  });
  it('retains zero and negative numeric values as numbers', () => {
    expect(csvDocument(['Amount', 'Balance'], [[0, -12.5], [null, undefined]])).toBe('Amount,Balance\n0,-12.5\n,');
  });
  it('round-trips a complete download URI including hash, percent, Unicode and newlines', () => {
    const csv = csvDocument(['Name'], [['Tea #1, 50% தமிழ்\nsecond line']]);
    expect(decodeURIComponent(csvDataUri(csv).split(',').slice(1).join(','))).toBe(csv);
    expect(csvDataUri(csv)).not.toContain('#');
  });
});
