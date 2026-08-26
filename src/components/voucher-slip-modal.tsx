"use client";

import React from "react";
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Phone,
  MapPin,
  Trees,
} from "lucide-react";

export interface VoucherSlipData {
  voucherType: "SALES" | "PURCHASE";
  voucherNo: string;
  date: string;
  title?: string;
  category?: string;
  partyName: string;
  partyContact?: string;
  partyAddress?: string;
  vendorBillNo?: string;
  vendorGstin?: string;
  plotName: string;
  cropActivityName: string;
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  taxPercent?: number;
  taxAmount?: number;
  discount?: number;
  totalAmount: number;
  paymentMode?: string;
  paymentStatus?: "PAID" | "PENDING" | "PARTIAL";
  referenceNo?: string;
  loggedBy: string;
  notes?: string;
}

interface VoucherSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: VoucherSlipData | null;
}

// Number to Words Converter in Indian Numbering System
function numberToWords(num: number): string {
  if (!num || isNaN(num)) return "Zero Rupees Only";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    );
  }

  const integerPart = Math.floor(num);
  return `Rupees ${inWords(integerPart)} Only`;
}

export function VoucherSlipModal({ isOpen, onClose, voucher }: VoucherSlipModalProps) {
  if (!isOpen || !voucher) return null;

  const isSales = voucher.voucherType === "SALES";
  const formattedAmountWords = numberToWords(voucher.totalAmount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:my-0">
        {/* Modal Top Actions Header (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              {isSales ? "Estate Sales Voucher Preview" : "Estate Purchase Voucher Preview"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Voucher Slip
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper Slip Body */}
        <div className="p-8 space-y-6 text-slate-900 bg-white" id="voucher-printable-area">
          {/* Estate Letterhead Header */}
          <div className="border-b-2 border-emerald-800 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-800 text-white rounded-xl shadow-xs">
                  <Trees className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-emerald-950 uppercase">
                    Ranga Estate
                  </h1>
                  <p className="text-xs font-semibold text-emerald-800 tracking-wide uppercase">
                    PWCW Agro & Plantation Enterprises
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Field Operations & Agronomy Division • Tamil Nadu, India
                  </p>
                </div>
              </div>

              {/* Official Voucher Type Title Banner */}
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-5">
                <span
                  className={`inline-block px-3 py-1 text-xs font-black tracking-wider uppercase rounded-md shadow-xs ${
                    isSales
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-emerald-100 text-emerald-900 border border-emerald-300/80"
                  }`}
                >
                  {isSales ? "OFFICIAL SALES VOUCHER" : "OFFICIAL PURCHASE VOUCHER"}
                </span>
                <div className="mt-2 text-xs text-slate-700 font-mono font-bold">
                  VOUCHER NO: <span className="text-slate-950 font-black">{voucher.voucherNo}</span>
                </div>
                <div className="text-xs text-slate-500">
                  DATE: <span className="font-semibold text-slate-800">{voucher.date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Party & Voucher Metadata Two-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Box 1: Party / Client / Vendor Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  {isSales ? "Billed To / Buyer Details" : "Vendor / Supplier Details"}
                </span>
                {voucher.paymentStatus && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      voucher.paymentStatus === "PAID"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : voucher.paymentStatus === "PENDING"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
                    }`}
                  >
                    {voucher.paymentStatus === "PAID" && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {voucher.paymentStatus === "PENDING" && <Clock className="w-2.5 h-2.5" />}
                    {voucher.paymentStatus === "PARTIAL" && <AlertCircle className="w-2.5 h-2.5" />}
                    {voucher.paymentStatus}
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold text-sm text-slate-900">{voucher.partyName || "General Party"}</p>
                {voucher.partyContact && (
                  <p className="text-slate-600 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" /> {voucher.partyContact}
                  </p>
                )}
                {voucher.partyAddress && (
                  <p className="text-slate-600 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" /> {voucher.partyAddress}
                  </p>
                )}
                {voucher.vendorBillNo && (
                  <p className="text-slate-600 font-mono mt-1">
                    <span className="font-semibold text-slate-700">Vendor Bill/Inv #:</span> {voucher.vendorBillNo}
                  </p>
                )}
                {voucher.vendorGstin && (
                  <p className="text-slate-600 font-mono mt-0.5">
                    <span className="font-semibold text-slate-700">GSTIN:</span> {voucher.vendorGstin}
                  </p>
                )}
              </div>
            </div>

            {/* Box 2: Estate Department & Accounting Allocation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  Accounting & Department Allocation
                </span>
                <span className="font-mono text-[10px] text-slate-500 font-bold">
                  {voucher.category || voucher.title || (isSales ? "Produce Sale" : "General Expense")}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plot Allocation:</span>
                  <span className="font-bold text-slate-900">{voucher.plotName || "General Estate"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Crop / Activity:</span>
                  <span className="font-bold text-emerald-800">{voucher.cropActivityName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold text-slate-800">{voucher.paymentMode || "Cash / Direct"}</span>
                </div>
                {voucher.referenceNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Ref / Txn ID:</span>
                    <span className="font-mono font-semibold text-slate-800">{voucher.referenceNo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Logged By:</span>
                  <span className="font-semibold text-slate-700">{voucher.loggedBy}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Particulars Grid */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Item Particulars / Description</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Unit Rate (₹)</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {voucher.items && voucher.items.length > 0 ? (
                  voucher.items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center text-slate-400 font-mono font-medium">
                        {index + 1}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{item.description}</td>
                      <td className="p-3 text-right text-slate-700 font-medium font-mono">
                        {item.quantity} {item.unit || "units"}
                      </td>
                      <td className="p-3 text-right text-slate-700 font-mono">
                        ₹{Number(item.rate).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">
                        ₹{Number(item.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-center text-slate-400 font-mono">1</td>
                    <td className="p-3 font-semibold text-slate-900">
                      {isSales ? "Estate Crop Produce Harvest Sale" : "General Estate Supplies & Operations"}
                    </td>
                    <td className="p-3 text-right font-mono">1 lot</td>
                    <td className="p-3 text-right font-mono">₹{voucher.totalAmount.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-slate-900 font-mono">
                      ₹{voucher.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Box & Amount in Words */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
            {/* Left: Notes and Amount In Words */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Amount Chargeable in Words:
                </span>
                <p className="text-xs font-bold text-emerald-950 italic mt-0.5">
                  {formattedAmountWords}
                </p>
              </div>

              {voucher.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Special Remarks / Dispatch Notes:
                  </span>
                  <p className="text-slate-700 mt-0.5">{voucher.notes}</p>
                </div>
              )}
            </div>

            {/* Right: Calculations Summary Table */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">
                  ₹{(voucher.subtotal || voucher.totalAmount).toLocaleString()}
                </span>
              </div>

              {(voucher.taxAmount ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax ({voucher.taxPercent}%):</span>
                  <span className="font-semibold text-slate-800">₹{voucher.taxAmount?.toLocaleString()}</span>
                </div>
              )}

              {(voucher.discount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount / Rebate:</span>
                  <span className="font-semibold">-₹{voucher.discount?.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-sm">
                <span className="font-bold font-sans text-slate-900 uppercase">
                  Net Total Amount:
                </span>
                <span
                  className={`font-black text-base ${
                    isSales ? "text-emerald-800" : "text-slate-900"
                  }`}
                >
                  ₹{voucher.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Formal Signature Blocks */}
          <div className="border-t border-slate-300 pt-8 mt-6">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-slate-600 font-semibold font-mono text-[11px]">
                  {voucher.loggedBy}
                </div>
                <p className="mt-1 font-bold text-slate-700 text-[11px]">Prepared / Logged By</p>
                <p className="text-[10px] text-slate-400">Estate Accounts Staff</p>
              </div>

              <div>
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-slate-600 font-semibold font-mono text-[11px]">
                  [ Verified & Approved ]
                </div>
                <p className="mt-1 font-bold text-slate-700 text-[11px]">Estate Manager</p>
                <p className="text-[10px] text-slate-400">Authorized Signatory</p>
              </div>

              <div>
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-slate-600 font-semibold font-mono text-[11px]">
                  {voucher.partyName ? `For ${voucher.partyName}` : "—"}
                </div>
                <p className="mt-1 font-bold text-slate-700 text-[11px]">
                  {isSales ? "Customer / Receiver" : "Vendor / Supplier"}
                </p>
                <p className="text-[10px] text-slate-400">Acknowledgment Signature</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            Computer generated official voucher record from Ranga Estate PWCW Management System • Valid without physical seal
          </div>
        </div>
      </div>
    </div>
  );
}
