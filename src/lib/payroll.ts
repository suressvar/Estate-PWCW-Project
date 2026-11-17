import type { EmployeeItem } from './db-storage';
import { money } from './money';
import { finiteNumber } from './validation';
/** Worker projections use an eight-hour day; monthly salaries retain their own monthly calculation. */
export function employeeDailyRate(employee: Pick<EmployeeItem, 'wageType' | 'wageRate'>): number {
  const rate = finiteNumber(employee.wageRate, 'Wage rate');
  return money(employee.wageType === 'MONTHLY' ? rate / 26 : employee.wageType === 'HOURLY' ? rate * 8 : rate);
}
