// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DataTable, type Column } from '../src/components/ui/data-table';
import { RoleBadge } from '../src/components/ui/role-badge';
import { StatCard, type StatCardVariant } from '../src/components/ui/stat-card';
import { TransactionForm } from '../src/components/ui/transaction-form';
afterEach(cleanup);

type Row = { name: string; count: number };
const data: Row[] = [{ name: 'Zebra', count: 2 }, { name: 'Alpha', count: 10 }];
const columns: Column<Row>[] = [{ header: 'Name', accessorKey: 'name', sortable: true }, { header: 'Count', accessorKey: 'count', sortable: true }];
describe('data table interactions', () => {
  it('filters case-insensitively and shows empty-state text', () => {
    render(<DataTable data={data} columns={columns} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ALP' } });
    expect(screen.getByText('Alpha')).toBeDefined(); expect(screen.queryByText('Zebra')).toBeNull();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'missing' } });
    expect(screen.getByText('No records match search parameters.')).toBeDefined();
  });
  it('sorts numbers numerically, toggles direction, and leaves input unchanged', () => {
    render(<DataTable data={data} columns={columns} />);
    fireEvent.click(screen.getByText('Count'));
    expect(within(screen.getAllByRole('row')[1]).getByText('Zebra')).toBeDefined();
    fireEvent.click(screen.getByText('Count'));
    expect(within(screen.getAllByRole('row')[1]).getByText('Alpha')).toBeDefined();
    expect(data[0].name).toBe('Zebra');
  });
  it('limits search to the selected field', () => {
    render(<DataTable data={data} columns={columns} searchField="name" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '10' } });
    expect(screen.queryByText('Alpha')).toBeNull();
  });
  it('renders custom cells and empty data', () => {
    const { rerender } = render(<DataTable data={data} columns={[{ header: 'Custom', accessorKey: row => <b>{row.name}!</b> }]} />);
    expect(screen.getByText('Alpha!')).toBeDefined();
    rerender(<DataTable data={[]} columns={columns} />);
    expect(screen.getByText('No records match search parameters.')).toBeDefined();
  });
});
describe('shared display components', () => {
  it.each([['admin', 'Admin'], ['OWNER', 'Admin'], ['MANAGER', 'Manager'], ['FIELD_STAFF', 'Field Staff'], ['unknown', 'Field Staff']])('displays %s as %s', (role, label) => {
    render(<RoleBadge role={role} />); expect(screen.getByText(label)).toBeDefined();
  });
  it.each(['default', 'emerald', 'violet', 'rose', 'amber', 'cyan', 'blue'] as StatCardVariant[])('renders %s stat cards', (variant) => {
    render(<StatCard title="Revenue" value={0} variant={variant} change="+5%" isPositive badge="Today" description="Sales" icon={<span>Icon</span>} />);
    for (const text of ['Revenue', '0', '+5%', 'Today', 'Sales', 'Icon']) expect(screen.getByText(text)).toBeDefined();
  });
  it('submits field log callback once', () => {
    const onSuccess = vi.fn(); render(<TransactionForm onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit Field Log' })); expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
