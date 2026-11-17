// @vitest-environment jsdom
/// <reference types="vite/client" />
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { requestApi } from './helpers/api';
import { seedRecords } from './helpers/seed';
import { getDatabase } from '../src/lib/db-storage';
import { AppShell } from '../src/components/app-shell';
import { CascadeLogForm } from '../src/components/cascade-log-form';

const navigation = vi.hoisted(() => ({ pathname: '/', params: {} as Record<string, string>, push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => navigation, usePathname: () => navigation.pathname, useParams: () => navigation.params, useSearchParams: () => new URLSearchParams(), redirect: (path: string) => navigation.push(path) }));
vi.mock('next/link', () => ({ default: ({ href, children, prefetch: _prefetch, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => { void _prefetch; return <a href={String(href)} {...props}>{children}</a>; } }));
const pages = import.meta.glob('../src/app/**/page.tsx');
let active = 0;
const failures: string[] = [];
beforeEach(() => {
  failures.length = 0; active = 0; navigation.push.mockClear();
  vi.stubGlobal('React', React);
  vi.stubGlobal('alert', vi.fn()); vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    active++;
    try {
      return await requestApi(String(input), init?.method || 'GET', typeof init?.body === 'string' ? JSON.parse(init.body) : undefined);
    } catch (error) { failures.push(String(error)); throw error; }
    finally { active--; }
  }));
});

describe('shared navigation and cascade entry behavior', () => {
  it('shows the login content without administrator navigation', () => {
    navigation.pathname = '/login';
    render(<AppShell>Sign-in content</AppShell>);
    expect(screen.getByText('Sign-in content')).toBeDefined();
    expect(screen.queryByRole('complementary')).toBeNull();
  });
  it('opens mobile navigation and expands the plot navigation links', () => {
    navigation.pathname = '/';
    render(<AppShell>Dashboard content</AppShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Open Navigation Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Plots & Crops' }));
    expect(screen.getByRole('link', { name: 'Plots Master' }).getAttribute('href')).toBe('/plots');
    fireEvent.click(screen.getByRole('button', { name: 'Close Sidebar' }));
    expect(screen.getByText('Dashboard content')).toBeDefined();
  });
  for (const fails of [false, true]) it(`cascade entry ${fails ? 'retains values and displays a rejected save' : 'saves the selected plot and crop'}`, async () => {
    const r = seedRecords(); const saved = vi.fn();
    const view = render(<CascadeLogForm moduleTitle="Fertilizer" submitEndpoint="/api/fertilizer-logs" onSuccess={saved} initialExtraState={{ transactionType: 'PURCHASE', quantityKg: 10, cost: 20, loggedBy: 'Tester' }} renderExtraFields={state => <span>{state.quantityKg} kg</span>} />);
    await waitFor(() => expect(view.container.querySelector('#form-plot-select')?.textContent).toContain(r.plot.name));
    if (fails) vi.mocked(fetch).mockResolvedValueOnce(Response.json({ error: 'Stock validation rejected' }, { status: 400 }));
    fireEvent.change(view.container.querySelector('#form-date-input')!, { target: { value: '2026-11-16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Immutable Log Entry' }));
    if (fails) {
      await screen.findByRole('alert');
      expect(screen.getByRole('alert').textContent).toContain('Stock validation rejected');
      expect(saved).not.toHaveBeenCalled(); expect(getDatabase().fertilizerLogs).toEqual([]);
    } else {
      await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
      expect(getDatabase().fertilizerLogs[0]).toMatchObject({ plotCropId: r.association?.id, quantityKg: 10, date: '2026-11-16' });
    }
  });
});

describe('form lifecycle and saved master data', () => {
  for (const example of [
    { route: 'employees', open: 'Add Employee', selector: '[placeholder="e.g. Murugan K."]', collection: 'employees' },
    { route: 'ledger-groups', open: 'Add New Group', selector: '[placeholder="e.g. Direct Expenses, Selling Overheads"]', collection: 'ledgerGroups' },
    { route: 'expense-ledgers', open: 'Add New Account', selector: '[placeholder="e.g. Feed Expenses, Harvest Sales, EB Power"]', collection: 'expenseLedgers' },
    { route: 'machines', open: 'Register Machine', selector: '[placeholder="e.g. John Deere 5050D, VST Shakti Power Tiller"]', collection: 'machines' },
    { route: 'items', open: 'Add New Item', selector: '[placeholder="e.g. Urea 46% N, High Speed Diesel, Hybrid Maize Seeds"]', collection: 'operationItems' },
    { route: 'stock-valuations', open: 'Add Valuation Period', selector: '[placeholder="e.g. FY 2026-27 Q1"]', collection: 'stockValuations' },
    { route: 'expenses', open: 'Log General Expense', selector: '[placeholder="e.g. Purchased PVC irrigation connectors, emergency diesel purchase, tea refreshments for workers..."]', collection: 'generalExpenses' },
    { route: 'employee-roles', open: '', selector: '[placeholder="e.g. Milking Operator, Watchman"]', collection: 'employeeRoles' },
  ] as const) {
    it(`${example.route} saves entered form values through its actual handler`, async () => {
      seedRecords(); navigation.pathname = `/${example.route}`;
      const pageModule = await pages[`../src/app/${example.route}/page.tsx`]() as { default: React.ComponentType };
      const view = render(<pageModule.default />);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
      if (example.open) fireEvent.click(screen.getByRole('button', { name: example.open }));
      const name = `Saved ${example.route}`;
      await waitFor(() => expect(view.container.querySelector(example.selector)).not.toBeNull());
      const input = view.container.querySelector(example.selector)!;
      expect(input).not.toBeNull();
      fireEvent.change(input, { target: { value: name } });
      const form = input.closest('form')!;
      if (example.route === 'expenses') fireEvent.change(form.querySelector('[placeholder="e.g. 750"]')!, { target: { value: '750' } });
      if (example.route === 'stock-valuations') {
        const dates = form.querySelectorAll('input[type="date"]');
        fireEvent.change(dates[0], { target: { value: '2026-01-01' } }); fireEvent.change(dates[1], { target: { value: '2026-12-31' } });
      }
      const before = getDatabase()[example.collection]!.length;
      fireEvent.submit(form);
      await waitFor(() => expect(getDatabase()[example.collection]).toHaveLength(before + 1));
      expect(JSON.stringify(getDatabase()[example.collection])).toContain(name);
      if (example.route === 'machines') fireEvent.click(screen.getByRole('button', { name: /Machinery Register/ }));
      await screen.findAllByText(name);
      expect(failures).toEqual([]);
    });
  }
  it('records a sale through the itemized form and navigates to its invoice', async () => {
    seedRecords(); const pageModule = await pages['../src/app/sales/page.tsx']() as { default: React.ComponentType };
    render(<pageModule.default />);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
    for (const [label, value] of [['Buyer name', 'Component Buyer'], ['Sale item', 'Tomato'], ['Sale quantity', '3'], ['Sale unit price', '25']]) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Sales Transaction' }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalled());
    expect(getDatabase().otherSales[0]).toMatchObject({ buyerName: 'Component Buyer', quantity: 3, totalAmount: 75 });
  });
  it('records a purchase through the form with derived totals and inward stock', async () => {
    seedRecords(); const pageModule = await pages['../src/app/purchases/page.tsx']() as { default: React.ComponentType };
    render(<pageModule.default />);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
    fireEvent.click(screen.getAllByRole('button', { name: 'New Voucher' })[0]);
    for (const [label, value] of [['Supplier name', 'Component Supplier'], ['Purchase item', 'Copper pipe'], ['Purchase quantity', '2'], ['Purchase unit price', '15']]) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Voucher' }));
    await waitFor(() => expect(getDatabase().generalPurchaseLogs).toHaveLength(1));
    expect(getDatabase().generalPurchaseLogs[0].cost).toBe(30);
    expect(getDatabase().godownItems!.find(item => item.name === 'Copper pipe')?.availableQuantity).toBe(2);
  });
  for (const [route, open] of [
    ['plots', 'Create New Plot'], ['crops', 'Create New Crop / Activity'], ['employees', 'Add Employee'],
    ['ledger-groups', 'Add New Group'], ['expense-ledgers', 'Add New Account'], ['stock-valuations', 'Add Valuation Period'],
    ['items', 'Add New Item'], ['expenses', 'Log General Expense'],
  ]) {
    it(`${route} cancels an unsaved form without changing records`, async () => {
      seedRecords(); navigation.pathname = `/${route}`;
      const pageModule = await pages[`../src/app/${route}/page.tsx`]() as { default: React.ComponentType };
      render(<pageModule.default />);
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 80)); });
      await waitFor(() => expect(active).toBe(0));
      const original = structuredClone(getDatabase());
      fireEvent.click(screen.getByRole('button', { name: open }));
      const cancel = await screen.findByRole('button', { name: 'Cancel' });
      fireEvent.click(cancel);
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull());
      expect(getDatabase()).toEqual(original);
    });
  }
  it('creates a plot through the form and filters the persisted result', async () => {
    const pageModule = await pages['../src/app/plots/page.tsx']() as { default: React.ComponentType };
    const view = render(<pageModule.default />);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 80)); });
    fireEvent.click(screen.getByRole('button', { name: 'Create New Plot' }));
    for (const [id, value] of [['plot-name-input', 'Form Test Plot'], ['plot-location-input', 'East'], ['plot-area-input', '7.5']]) fireEvent.change(view.container.querySelector(`#${id}`)!, { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Record' }));
    await waitFor(() => expect(getDatabase().plots).toHaveLength(1));
    await screen.findByText('Form Test Plot');
    expect(getDatabase().plots[0]).toMatchObject({ name: 'Form Test Plot', areaAcres: 7.5 });
  });
  it('creates a crop through the form with a persisted classification', async () => {
    const pageModule = await pages['../src/app/crops/page.tsx']() as { default: React.ComponentType };
    const view = render(<pageModule.default />);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 80)); });
    fireEvent.click(screen.getByRole('button', { name: 'Create New Crop / Activity' }));
    fireEvent.change(view.container.querySelector('#crop-name-input')!, { target: { value: 'Form Test Crop' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Record' }));
    await waitFor(() => expect(getDatabase().crops).toHaveLength(1));
    await screen.findByText('Form Test Crop');
    expect(getDatabase().crops[0].type).toBeTruthy();
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('application pages with real in-memory API handlers', () => {
  for (const [file, load] of Object.entries(pages)) {
    for (const populated of [false, true]) {
      it(`${file.replace('../src/app', '')}: ${populated ? 'populated records' : 'empty store'} loads supported content`, async () => {
        const records = populated ? seedRecords() : undefined;
        navigation.pathname = file.replace('../src/app', '').replace('/page.tsx', '') || '/';
        navigation.params = { id: navigation.pathname.includes('crop-cycles') ? records?.cycle.id || 'missing' : navigation.pathname.includes('employees') ? records?.employee.id || 'missing' : records?.sale.invoiceGroupId || 'missing', v_type: 'feed', s_type: 'other' };
        const pageModule = await load() as { default: React.ComponentType };
        const view = render(<pageModule.default />);
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 80)); });
        await waitFor(() => {
          expect(active).toBe(0);
          expect(failures).toEqual([]);
          const content = view.container.textContent || '';
          if (!content.trim()) expect(navigation.push).toHaveBeenCalled();
          else expect(content).not.toMatch(/^\s*Loading(?:\s|\.)[^]*$/i);
        });
        expect(view.container.querySelector('[role="alert"]')?.textContent || '').not.toMatch(/exception|undefined|not a function/i);
      });
    }
  }
});
