import type { FeedPurchase,MedicinePurchase,OtherSaleItem,OtherVoucher,VaccinePurchase } from '@/lib/db-storage';
import type { NextResponse } from 'next/server';
export type DashboardAnalytics = Awaited<ReturnType<typeof import('@/app/api/analytics/route').GET>> extends NextResponse<infer T> ? T : never;
export type SalesAnalytics = ReturnType<typeof import('@/lib/sales-data').calculateSalesAnalytics>;
export type ModuleStockSummary = ReturnType<typeof import('@/lib/godown-data').getModuleStockSummary>;
export type AttendanceSummary = ReturnType<typeof import('@/lib/hr-data').getAttendanceSummary>;
export type WorkerSheet = ReturnType<typeof import('@/lib/worker-data').getDailyAttendanceSheet>;
export type MonthlyWorkerSummary = ReturnType<typeof import('@/lib/worker-data').getMonthlyWorkerSummary>;
export type SalesInvoice = ReturnType<typeof import('@/lib/sales-data').getSalesByInvoiceGroup>;
export type SaleRow = OtherSaleItem & { paymentMode?: string; plotName?: string };
export type VoucherView = Partial<FeedPurchase & MedicinePurchase & VaccinePurchase & OtherVoucher> & {
  id: string; sellerName?: string; tagId?: string; breed?: string; gender?: 'Male' | 'Female';
  weight?: number; price?: number; ageMonths?: number;
};
