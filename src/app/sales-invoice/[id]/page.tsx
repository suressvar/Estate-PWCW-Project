"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  Sliders,
  Check,
  Building2,
  DollarSign,
  Receipt,
  FileText,
} from "lucide-react";

export default function SalesInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const autoPrint = searchParams.get("print") === "true";

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Spacing & Layout Options matching Picture 3
  const [rowSpacing, setRowSpacing] = useState<"Compact" | "Normal" | "Relaxed">("Normal");
  const [signatureHeight, setSignatureHeight] = useState<"Small Space" | "Medium Space" | "Large Space">("Medium Space");
  const [showBankDetails, setShowBankDetails] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
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

  useEffect(() => {
    if (!loading && invoice && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, invoice, autoPrint]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-500 font-medium">
        Loading sales invoice...
      </div>
    );
  }

  if (!invoice || !invoice.otherItems || invoice.otherItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <div className="text-red-500 font-bold text-base">Sales invoice not found.</div>
        <Link
          href="/sales-register"
          className="inline-block px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg"
        >
          Return to Sales Register
        </Link>
      </div>
    );
  }

  const { otherItems = [], totalAmount = 0, dateOfSale, buyerName, buyerCity, buyerContact, invoiceGroupId } = invoice;

  // Format invoice number
  const invoiceNumber = invoiceGroupId?.startsWith("inv_")
    ? `INV-OTH-${invoiceGroupId.slice(-4).padStart(4, "0")}`
    : invoiceGroupId || `INV-OTH-${id.slice(-4)}`;

  // Dynamic row padding based on rowSpacing
  const rowPaddingClass =
    rowSpacing === "Compact"
      ? "py-1.5 px-3"
      : rowSpacing === "Relaxed"
      ? "py-4 px-4"
      : "py-2.5 px-3.5";

  // Dynamic signature height based on signatureHeight
  const signatureHeightClass =
    signatureHeight === "Small Space"
      ? "h-12"
      : signatureHeight === "Large Space"
      ? "h-28"
      : "h-20";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 print:p-0 print:m-0 print:max-w-none">
      {/* ========================================================================= */}
      {/* TOP CONTROLS (PICTURE 3) - HIDDEN DURING PRINT */}
      {/* ========================================================================= */}
      <div className="space-y-4 print:hidden">
        {/* Action Buttons: Back to Register & Print Invoice */}
        <div className="flex items-center gap-3">
          <Link
            href="/sales-register"
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-full shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Register</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice / Save PDF</span>
          </button>
        </div>

        {/* Invoice Layout & Spacing Options Card (Picture 3) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold tracking-tight">
              Invoice Layout & Spacing Options
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 -mt-1">
            Adjust table size, margins, and bank details dynamically to fit perfectly in 1 A4 page.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
            {/* Row Spacing */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Row Spacing:</span>
              <select
                value={rowSpacing}
                onChange={(e) => setRowSpacing(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Compact">Compact</option>
                <option value="Normal">Normal</option>
                <option value="Relaxed">Relaxed</option>
              </select>
            </div>

            {/* Signature Height */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Signature Height:</span>
              <select
                value={signatureHeight}
                onChange={(e) => setSignatureHeight(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Small Space">Small Space</option>
                <option value="Medium Space">Medium Space</option>
                <option value="Large Space">Large Space</option>
              </select>
            </div>

            {/* Show Bank Details Toggle Switch */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={showBankDetails}
                onClick={() => setShowBankDetails(!showBankDetails)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showBankDetails ? "bg-[#2563eb]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    showBankDetails ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="font-bold text-slate-700">Show Bank Details</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL PRINTABLE SALES INVOICE (PICTURE 2) */}
      {/* ========================================================================= */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 space-y-6 text-slate-800 text-xs font-sans">
        {/* Document Title (Picture 2) */}
        <div className="text-center pb-2">
          <h1 className="text-base font-black tracking-widest text-slate-900 uppercase">
            SALES INVOICE
          </h1>
        </div>

        {/* Top Header: Brand Info & Invoice Meta */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          {/* Brand & Address */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#15803d] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-black text-slate-900 tracking-tight">
                Ranga Estate
              </div>
              <div className="text-slate-600 font-medium text-xs">
                pachapalayam, Coimbatore 641010
              </div>
              <div className="text-slate-500 font-medium text-xs">
                Phone: 9876543210
              </div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="text-left sm:text-right space-y-0.5 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-700">Invoice #: </span>
              <span className="font-mono font-bold text-slate-900">{invoiceNumber}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Date: </span>
              <span className="font-semibold text-slate-800">{dateOfSale}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Category: </span>
              <span className="font-semibold text-slate-800">{invoice.category || "General Estate Sales"}</span>
            </div>
          </div>
        </div>

        {/* Horizontal Divider Line */}
        <div className="border-t border-slate-200" />

        {/* Bill To & Bank Details Cards (Picture 2) */}
        <div className={`grid grid-cols-1 ${showBankDetails ? "sm:grid-cols-2" : "sm:grid-cols-1"} gap-4`}>
          {/* Bill to Buyer Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-1">
            <div className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">
              BILL TO BUYER:
            </div>
            <div className="text-base font-extrabold text-[#15803d] tracking-tight">
              {buyerName || "Walk-in Customer"}
            </div>
            {buyerCity && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">City: </span>
                {buyerCity}
              </div>
            )}
            {buyerContact && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Contact: </span>
                {buyerContact}
              </div>
            )}
          </div>

          {/* Bank Payments Card (conditionally displayed based on toggle) */}
          {showBankDetails && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-1">
              <div className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                BANK PAYMENTS:
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Bank Name: </span>
                <span>State Bank of India</span>
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Account No: </span>
                <span>389201948210</span>
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">IFSC Code: </span>
                <span>SBIN0004210</span>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Items Table (Picture 2) */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-center w-14 border-r border-slate-200">S.No</th>
                <th className="py-2.5 px-4 border-r border-slate-200">Item / Description</th>
                <th className="py-2.5 px-4 text-center border-r border-slate-200 w-32">Quantity</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200 w-36">Price per Unit</th>
                <th className="py-2.5 px-4 text-right w-36">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {otherItems.map((item: any, index: number) => (
                <tr key={item.id || index} className="hover:bg-slate-50/50">
                  <td className={`${rowPaddingClass} text-center text-slate-500 border-r border-slate-200 font-medium`}>
                    {index + 1}
                  </td>
                  <td className={`${rowPaddingClass} border-r border-slate-200 font-bold text-slate-900`}>
                    {item.itemName}
                  </td>
                  <td className={`${rowPaddingClass} text-center border-r border-slate-200 font-medium`}>
                    {item.quantity} {item.unit}
                  </td>
                  <td className={`${rowPaddingClass} text-right border-r border-slate-200 font-medium`}>
                    ₹{Number(item.pricePerUnit).toFixed(2)}
                  </td>
                  <td className={`${rowPaddingClass} text-right font-bold text-slate-900`}>
                    ₹{Number(item.totalAmount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary Box (Picture 2) */}
        <div className="flex justify-end pt-2">
          <div className="w-72 space-y-2 p-3 bg-slate-50/50 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">₹{Number(totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Tax / GST (0%):</span>
              <span className="font-bold text-slate-900">₹0.00</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 text-sm">Grand Total:</span>
              <span className="font-black text-lg text-[#15803d]">
                ₹{Number(totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Spacing before Signatures */}
        <div className={signatureHeightClass} />

        {/* Signatures Block (Picture 2) */}
        <div className="flex justify-between items-end text-xs text-slate-700 pt-4">
          <div className="text-center">
            <div className="font-bold text-slate-800">Customer Signature</div>
          </div>

          <div className="text-center">
            <div className="font-bold text-slate-800">Authorized Signatory</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Ranga Estate Management
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Divider */}
        <div className="border-t border-slate-200 pt-3" />

        {/* Centered Thank You Footer (Picture 2) */}
        <div className="text-center text-xs text-slate-500 font-medium">
          Thank you for your business! Please visit us again.
        </div>
      </div>
    </div>
  );
}
