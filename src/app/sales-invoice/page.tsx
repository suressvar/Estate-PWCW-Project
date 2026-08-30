"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowRight, Plus } from "lucide-react";

export default function SalesInvoiceIndexPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
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
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-slate-500 font-medium">
        Loading sales invoices...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
        <FileText className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Ranga Estate Sales Invoices</h1>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">
        No sales transactions have been recorded yet. Create your first sales entry to generate an official tax invoice.
      </p>
      <div className="pt-2">
        <Link
          href="/sales"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Sales Entry</span>
        </Link>
      </div>
    </div>
  );
}
