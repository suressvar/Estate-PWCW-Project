"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, Download, CheckCircle, ShieldCheck } from "lucide-react";

export default function SalesInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sales-invoice/${id}`);
        const data = await res.json();
        setInvoice(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Generating official tax invoice...</div>;
  }

  if (!invoice) {
    return <div className="p-12 text-center text-red-500 font-bold">Sales invoice not found.</div>;
  }

  const { otherItems = [], totalAmount = 0, dateOfSale, buyerName, buyerCity, buyerContact, invoiceGroupId } = invoice;
  const allItems = [
    ...otherItems.map((o: any) => ({
      itemDescription: `${o.itemName}`,
      quantity: `${o.quantity} ${o.unit}`,
      unitPrice: `₹${o.pricePerUnit}`,
      price: o.totalAmount,
    })),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Toolbar (Hidden during print) */}
      <div className="flex items-center justify-between print:hidden glass-panel p-4 rounded-2xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Register
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" /> Print Tax Invoice
          </button>
        </div>
      </div>

      {/* Printable A4 Invoice Container */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8 text-slate-800 text-xs font-sans">
        {/* Farm Header */}
        <div className="border-b-2 border-emerald-900 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-900 text-white flex items-center justify-center font-bold text-base">
                R
              </div>
              <h1 className="text-2xl font-black tracking-tight text-emerald-950">RANGA ESTATE & FARMS</h1>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Integrated Livestock, Agro Breeding & Organic Farm Operations
            </p>
            <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Survey No. 44/2B, Ranga Valley Estate Road, Pollachi, TN — 642001<br />
              Ph: +91 94430 88201 | Email: accounts@rangaestates.com | GSTIN: 33AABCR4912F1Z8
            </div>
          </div>

          <div className="text-right sm:text-right w-full sm:w-auto">
            <span className="inline-block px-3 py-1 bg-emerald-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">
              OFFICIAL SALES INVOICE
            </span>
            <div className="mt-2 text-xs font-semibold text-slate-600">
              Invoice Ref: <span className="font-mono font-bold text-slate-900">{invoiceGroupId || `INV-${id}`}</span>
            </div>
            <div className="text-xs text-slate-600">
              Date of Sale: <span className="font-bold text-slate-900">{dateOfSale}</span>
            </div>
          </div>
        </div>

        {/* Buyer & Consignee Details */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Billed To (Buyer):</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{buyerName || "Walk-in Buyer"}</div>
            <div className="text-xs text-slate-600 mt-0.5">{buyerCity || "Local Market District"}</div>
            {buyerContact && <div className="text-xs text-slate-500 font-mono mt-0.5">Contact: {buyerContact}</div>}
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Payment Status:</span>
            <div className="text-xs font-bold text-emerald-800 flex items-center justify-end gap-1 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Settled / Delivered
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Terms: Spot Immediate Settlement</div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Item / Livestock Description</th>
                <th className="p-3 text-center">Gender</th>
                <th className="p-3 text-center">Weight</th>
                <th className="p-3 text-center">Quantity</th>
                <th className="p-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900">{item.itemDescription}</td>
                  <td className="p-3 text-center text-slate-700">{item.gender}</td>
                  <td className="p-3 text-center font-semibold text-slate-700">{item.weight}</td>
                  <td className="p-3 text-center text-slate-700">{item.quantity}</td>
                  <td className="p-3 text-right font-bold text-slate-900">₹{Number(item.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td colSpan={5} className="p-3.5 text-right uppercase tracking-wider text-xs">
                  Grand Total Amount (INR):
                </td>
                <td className="p-3.5 text-right text-base font-extrabold text-emerald-900">
                  ₹{Number(totalAmount).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in Words & Terms */}
        <div className="space-y-3 pt-2">
          <div className="text-xs text-slate-700">
            <span className="font-bold">Total Payable: </span>
            <span className="italic font-medium">Indian Rupees {Number(totalAmount).toLocaleString()} Only</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700">Terms & Conditions:</div>
            <div>1. All livestock inspected and handed over in prime healthy condition.</div>
            <div>2. Health and vaccination certificates verified at dispatch point.</div>
            <div>3. This is a computer-generated tax invoice issued by Ranga Estate Farm Management System.</div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-12 flex justify-between items-end border-t border-slate-200">
          <div className="text-center">
            <div className="w-44 border-b border-slate-400 pb-1 text-slate-400 font-mono text-[10px]">Buyer's Signature</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Received in good condition</span>
          </div>

          <div className="text-center">
            <div className="w-48 border-b border-slate-400 pb-1 font-bold text-slate-900 text-xs">For RANGA ESTATE & FARMS</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Authorized Signatory</span>
          </div>
        </div>
      </div>
    </div>
  );
}
