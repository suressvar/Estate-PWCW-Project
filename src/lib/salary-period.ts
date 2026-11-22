import { finiteNumber, ValidationError } from './validation';

// Defaults apply only to omitted fields, never to an explicitly invalid value.
export function salaryPeriod(input: { year?: unknown; month?: unknown; workingDays?: unknown }, defaults = true) {
  const now = new Date();
  const year = finiteNumber(input.year, 'Year', 1900, defaults ? now.getFullYear() : undefined);
  const month = finiteNumber(input.month, 'Month', 1, defaults ? now.getMonth() + 1 : undefined);
  const workingDays = finiteNumber(input.workingDays, 'Working days', 1, 26);
  if (!Number.isInteger(year) || year > 9999 || !Number.isInteger(month) || month > 12) throw new ValidationError('Invalid salary period.');
  if (!Number.isInteger(workingDays) || workingDays > 31) throw new ValidationError('Working days must be between 1 and 31.');
  return { year, month, workingDays };
}

export function salaryPeriodQuery(request: Request) {
  const query = new URL(request.url).searchParams;
  return salaryPeriod({ year: query.get('year') ?? undefined, month: query.get('month') ?? undefined, workingDays: query.get('workingDays') ?? undefined });
}
