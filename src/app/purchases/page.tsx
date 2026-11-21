"use client";

import { PurchaseCategoriesModal } from "@/components/purchases/purchase-categories-modal";
import { PurchaseRegister } from "@/components/purchases/purchase-register";
import { PurchaseVoucherForm } from "@/components/purchases/purchase-voucher-form";
import { usePurchasesPage } from "@/components/purchases/use-purchases-page";
import { StatCard } from "@/components/ui/stat-card";
import { VoucherSlipModal } from "@/components/voucher-slip-modal";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import {
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  Layers,
  Plus,
  Receipt,
  Store,
  Tag,
} from "lucide-react";
import Link from "next/link";

export default function PurchasesPage() {
  const page = usePurchasesPage();
  const {
    setCatModalOpen,
    exportCSV,
    filteredLogs,
    setShowCreateForm,
    msg,
    totalCost,
    totalTransactions,
    categories,
    activeModalVoucher,
    setActiveModalVoucher,
  } = page;

  return (
    <PageContainer>
      {/* Standardized Page Header */}
      <PageHeader
        title="Voucher Entry"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Vouchers" },
          { label: "Voucher Entry" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCatModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Categories</span>
            </button>

            <button
              onClick={exportCSV}
              disabled={filteredLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/purchases/retailers"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Retailers / Suppliers</span>
            </Link>

            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Voucher</span>
            </button>
          </div>
        }
      />

      {/* Notification */}
      {msg && (
        <div
          role="status"
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-[#EAF3EE] text-[#16805D] border border-[#16805D]/25"
              : "bg-rose-50 text-[#DC3545] border border-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#16805D] shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Voucher Expenses"
          value={`₹${totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtitle="Net procurement expenditure"
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          title="Total Recorded Entries"
          value={totalTransactions}
          subtitle="Registered estate vouchers"
          icon={Receipt}
          variant="default"
        />
        <StatCard
          title="Active Categories"
          value={categories.length}
          subtitle="Configured purchase classifications"
          icon={Layers}
          variant="blue"
        />
      </div>

      {/* Voucher Form Overlay */}
      <PurchaseVoucherForm {...page} />

      {/* Register View */}
      <PurchaseRegister {...page} />

      {/* Modals */}
      <PurchaseCategoriesModal {...page} />
      {activeModalVoucher && (
        <VoucherSlipModal
          voucher={activeModalVoucher}
          onClose={() => setActiveModalVoucher(null)}
        />
      )}
    </PageContainer>
  );
}
