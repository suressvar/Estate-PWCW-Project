"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calculator,
  Printer,
  DollarSign,
  CheckCircle2,
  Calendar,
  Save,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { WageRecord } from "@/lib/hr-data";

export default function SalaryCalculatePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [workingDays, setWorkingDays] = useState(26);

  const [wages, setWages] = useState<WageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleCompute = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/salary/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, workingDays }),
      });
      const data = await res.json();
      setWages(data);
      setMsg({ type: "success", text: `Computed salaries for ${monthNames[month - 1]} ${year} from attendance logs!` });
      setTimeout(() => setMsg(null), 4000);
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRowAdjustment = async (wage: WageRecord, field: "bonus" | "deductions", val: number) => {
    try {
      const updatedWage = { ...wage, [field]: val };
      const res = await fetch(`/api/salary/pay/${wage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWage),
      });
      if (res.ok) {
        const saved = await res.json();
        setWages((prev) => prev.map((w) => (w.id === saved.id ? saved : w)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalGross = wages.reduce((acc, w) => acc + Number(w.grossSalary || 0), 0);
  const totalBonus = wages.reduce((acc, w) => acc + Number(w.bonus || 0), 0);
  const totalDeductions = wages.reduce((acc, w) => acc + Number(w.deductions || 0), 0);
  const totalNet = wages.reduce((acc, w) => acc + Number(w.netSalary || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <Calculator className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Salary & Wages Calculation Engine</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Print Payslips
          </button>
          <Link
            href="/wages"
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Wages Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Selector & Calculation Trigger */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">Select Month:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
            >
              {monthNames.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">Year:</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">Standard Working Days:</span>
            <input
              type="number"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              className="w-16 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center"
            />
          </div>
        </div>

        <button
          onClick={handleCompute}
          disabled={loading}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
        >
          <Calculator className="w-4 h-4" />
          {loading ? "Computing..." : `Calculate Salaries for ${monthNames[month - 1]}`}
        </button>
      </div>

      {/* Salary Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Designation</th>
                <th className="p-3.5">Wage Basis</th>
                <th className="p-3.5 text-center">Days Present</th>
                <th className="p-3.5">Gross (₹)</th>
                <th className="p-3.5">Bonus (₹)</th>
                <th className="p-3.5">Deductions (₹)</th>
                <th className="p-3.5 font-bold">Net Salary (₹)</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    Click &quot;Calculate Salaries&quot; above to compute payroll from attendance logs.
                  </td>
                </tr>
              ) : (
                wages.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{w.employeeName}</td>
                    <td className="p-3.5 text-slate-600">{w.roleName}</td>
                    <td className="p-3.5 text-slate-700">
                      ₹{w.wageRate} <span className="text-[11px] text-slate-500">({w.wageType})</span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800 font-mono">
                      {w.presentDays} / {w.workingDays} d
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">₹{Number(w.grossSalary).toLocaleString()}</td>

                    <td className="p-3.5">
                      <input
                        type="number"
                        defaultValue={w.bonus}
                        onBlur={(e) => handleRowAdjustment(w, "bonus", Number(e.target.value))}
                        className="w-20 p-1 bg-slate-50 border border-slate-300 rounded font-semibold text-emerald-800 text-xs"
                      />
                    </td>

                    <td className="p-3.5">
                      <input
                        type="number"
                        defaultValue={w.deductions}
                        onBlur={(e) => handleRowAdjustment(w, "deductions", Number(e.target.value))}
                        className="w-20 p-1 bg-slate-50 border border-slate-300 rounded font-semibold text-rose-800 text-xs"
                      />
                    </td>

                    <td className="p-3.5 font-extrabold text-emerald-900 text-sm">
                      ₹{Number(w.netSalary).toLocaleString()}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${w.status === "PAID" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals Summary */}
            {wages.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={4} className="p-3.5 uppercase tracking-wider text-right">
                    Total Payroll Sum:
                  </td>
                  <td className="p-3.5 text-slate-900">₹{totalGross.toLocaleString()}</td>
                  <td className="p-3.5 text-emerald-800">+₹{totalBonus.toLocaleString()}</td>
                  <td className="p-3.5 text-rose-800">-₹{totalDeductions.toLocaleString()}</td>
                  <td className="p-3.5 text-emerald-950 text-sm font-extrabold">
                    ₹{totalNet.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
