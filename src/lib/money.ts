import { finiteNumber, positiveNumber, requiredText, ValidationError } from './validation';
export function money(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER / 100) throw new ValidationError('Amount exceeds the supported monetary range.');
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
export function calculateVoucherTotals<T extends { quantity: number; rate: number; description: string }>(lines: readonly T[], taxInput: unknown = 0, discountInput: unknown = 0) {
  const items = lines.map(item => {
    const quantity = positiveNumber(item.quantity, 'Quantity');
    const rate = finiteNumber(item.rate, 'Rate');
    return { ...item, description: requiredText(item.description, 'Item description'), quantity, rate, amount: money(quantity * rate) };
  });
  const subtotal = money(items.reduce((sum, item) => sum + item.amount, 0));
  const taxPercent = finiteNumber(taxInput, 'Tax percentage');
  if (taxPercent > 100) throw new ValidationError('Tax percentage cannot exceed 100.');
  const discount = money(finiteNumber(discountInput, 'Discount'));
  const taxAmount = money(subtotal * taxPercent / 100);
  if (discount > subtotal + taxAmount) throw new ValidationError('Discount cannot exceed the invoice total.');
  return { items, subtotal, taxPercent, taxAmount, discount, total: money(subtotal + taxAmount - discount) };
}
