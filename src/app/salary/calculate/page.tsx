"use client";
import { errorMessage as getErrorMessage } from "@/lib/errors";

import { WageRecord } from "@/lib/hr-data";
import {
Calculator,
Check,
CheckCircle2,
Printer,
ShieldAlert,
X
} from "lucide-react";
import React,{ useCallback,useEffect,useState } from "react";

export default function SalaryCalculatePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [workingDays, setWorkingDays] = useState(26);

  const [wages, setWages] = useState<WageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settlement Modal State
  const [selectedWage, setSelectedWage] = useState<WageRecord | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // 1. Fetch Existing Calculated Wages for Year & Month
  const fetchWagesForPeriod = useCallback(async (yr: number, m: number) => {
    try {
      const res = await fetch(`/api/salary/calculate?year=${yr}&month=${m}`);
      if (res.ok) {
        const data = await res.json();
        setWages(data || []);
      }
    } catch (e) {
      console.error("Failed to load period wages", e);
    }
  }, []);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => { dispose = (() => {
    fetchWagesForPeriod(year, month);
  })(); }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
  }, [year, month, fetchWagesForPeriod]);

  // 2. Trigger Calculation Engine
  const handleCompute = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/salary/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, workingDays }),
      });
      if (res.ok) {
        const data = await res.json();
        setWages(data);
        setMsg({
          type: "success",
          text: `Successfully calculated salaries for ${monthNames[month - 1]} ${year} from active attendance records!`,
        });
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to calculate salaries." });
      }
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      setMsg({ type: "error", text: getErrorMessage(e) || "Failed to calculate salaries." });
    } finally {
      setLoading(false);
    }
  };

  // 3. Inline Bonus / Deduction Adjustment with Live Net Salary Update
  const handleRowAdjustment = async (wage: WageRecord, field: "bonus" | "deductions", val: number) => {
    try {
      const numericVal = Math.max(0, Number(val) || 0);
      const updatedBonus = field === "bonus" ? numericVal : Number(wage.bonus || 0);
      const updatedDeductions = field === "deductions" ? numericVal : Number(wage.deductions || 0);
      const recalculatedNet = Math.max(0, Number(wage.grossSalary || 0) + updatedBonus - updatedDeductions);

      const updatedWage = {
        ...wage,
        [field]: numericVal,
        netSalary: recalculatedNet,
      };

      // Optimistically update local state immediately
      setWages((prev) => prev.map((w) => (w.id === wage.id ? updatedWage : w)));

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
      console.error("Adjustment failed", e);
    }
  };

  // 4. Open Settlement Modal
  const openPayModal = (w: WageRecord) => {
    setSelectedWage(w);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("Bank Transfer");
    setPaymentReference(`IMPS-${Date.now().toString().slice(-6)}`);
    setPaymentNotes(`Salary payout for ${monthNames[w.month - 1]} ${w.year}`);
    setIsPayModalOpen(true);
  };

  // 5. Confirm Settlement
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWage) return;
    try {
      const res = await fetch(`/api/salary/pay/${selectedWage.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentDate,
          paymentMode,
          paymentReference,
          notes: paymentNotes,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWages((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        setIsPayModalOpen(false);
        setMsg({
          type: "success",
          text: `Recorded salary payment of ₹${Number(selectedWage.netSalary).toLocaleString()} for ${selectedWage.employeeName}.`,
        });
        setTimeout(() => setMsg(null), 4000);
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Payment recording failed." });
      }
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) || "Payment recording failed." });
    }
  };

  const totalGross = wages.reduce((acc, w) => acc + Number(w.grossSalary || 0), 0);
  const totalBonus = wages.reduce((acc, w) => acc + Number(w.bonus || 0), 0);
  const totalDeductions = wages.reduce((acc, w) => acc + Number(w.deductions || 0), 0);
  const totalNet = wages.reduce((acc, w) => acc + Number(w.netSalary || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <Calculator className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Salary & Wages Calculation Engine</h1>
              <p className="text-xs text-slate-500">
                Automated monthly salary computation based on verified attendance records & wage rates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print Payslips
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
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
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
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
              min="1"
              max="31"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              className="w-16 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center"
            />
          </div>
        </div>

        <button
          onClick={handleCompute}
          disabled={loading}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 hover:scale-[1.02]"
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
                <th className="p-3.5 text-right">Gross (₹)</th>
                <th className="p-3.5 text-center">Bonus (₹)</th>
                <th className="p-3.5 text-center">Deductions (₹)</th>
                <th className="p-3.5 text-right font-bold">Net Salary (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wages.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    No salary records calculated for {monthNames[month - 1]} {year}. Click &quot;Calculate Salaries&quot; above to compute payroll from attendance logs.
                  </td>
                </tr>
              ) : (
                wages.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{w.employeeName}</td>
                    <td className="p-3.5 text-slate-600">{w.roleName}</td>
                    <td className="p-3.5 text-slate-700">
                      ₹{Number(w.wageRate).toLocaleString()}{" "}
                      <span className="text-[11px] text-slate-500 font-mono">({w.wageType})</span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800 font-mono">
                      {w.presentDays} / {w.workingDays} d
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      ₹{Number(w.grossSalary).toLocaleString()}
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={w.bonus || ""}
                        placeholder="0"
                        onChange={(e) => handleRowAdjustment(w, "bonus", Number(e.target.value))}
                        className="w-20 p-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-semibold text-emerald-800 text-xs"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={w.deductions || ""}
                        placeholder="0"
                        onChange={(e) => handleRowAdjustment(w, "deductions", Number(e.target.value))}
                        className="w-20 p-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-semibold text-rose-800 text-xs"
                      />
                    </td>

                    <td className="p-3.5 text-right font-extrabold text-emerald-900 text-sm">
                      ₹{Number(w.netSalary).toLocaleString()}
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          w.status === "PAID"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      {w.status !== "PAID" ? (
                        <button
                          id={`pay-btn-${w.id}`}
                          onClick={() => openPayModal(w)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors"
                        >
                          Settle Pay
                        </button>
                      ) : (
                        <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{w.paymentMode || "Settled"}</span>
                        </div>
                      )}
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
                  <td className="p-3.5 text-right text-slate-900">₹{totalGross.toLocaleString()}</td>
                  <td className="p-3.5 text-center text-emerald-800">+₹{totalBonus.toLocaleString()}</td>
                  <td className="p-3.5 text-center text-rose-800">-₹{totalDeductions.toLocaleString()}</td>
                  <td className="p-3.5 text-right text-emerald-950 text-sm font-extrabold">
                    ₹{totalNet.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Settlement Payment Modal */}
      {isPayModalOpen && selectedWage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Settle Salary Payment</h3>
                <p className="text-xs text-slate-500">
                  {selectedWage.employeeName} &bull; {monthNames[selectedWage.month - 1]} {selectedWage.year}
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Salary:</span>
                <span className="font-bold text-slate-900">₹{Number(selectedWage.grossSalary).toLocaleString()}</span>
              </div>
              {selectedWage.bonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-emerald-700">Bonus:</span>
                  <span className="font-bold text-emerald-700">+₹{Number(selectedWage.bonus).toLocaleString()}</span>
                </div>
              )}
              {selectedWage.deductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-rose-700">Deductions:</span>
                  <span className="font-bold text-rose-700">-₹{Number(selectedWage.deductions).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-slate-200">
                <span className="text-slate-800 font-bold">Net Salary Payable:</span>
                <span className="font-black text-emerald-800 text-sm">
                  ₹{Number(selectedWage.netSalary).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. UTR12345678, IMPS Ref, or Cheque No"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Optional payout notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                >
                  Confirm Payout (₹{Number(selectedWage.netSalary).toLocaleString()})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
