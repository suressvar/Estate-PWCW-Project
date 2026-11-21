"use client";

import type { SaleRow } from "@/types/api";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export default function SalesInvoiceIndexPage() {
  const router = useRouter();
  const [, setInvoices] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sales/other");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const latestGroup = data[0].invoiceGroupId;
          if (latestGroup) {
            router.replace(`/sales-invoice/${latestGroup}`);
            return;
          }
        }
        setInvoices(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <PageContainer>
        <div className="py-20 text-center text-xs text-slate-500 font-medium">
          Loading sales invoices...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sales Invoices"
        breadcrumbs={[
          { label: "Sales & Distribution", href: "/sales-register" },
          { label: "Invoices" },
        ]}
      />

      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-[#EAF3EE] text-[#174D3C] flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          No Sales Invoices Generated
        </h2>
        <p className="text-xs text-slate-500">
          No sales transactions have been recorded yet. Create your first sales entry to generate an official tax invoice.
        </p>
        <div className="pt-2">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Sales Entry</span>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
