"use client";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Calculator,
  Check,
  CheckCircle2,
  DollarSign,
  Printer,
  ShieldAlert,
} from "lucide-react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { WageRecord } from "@/lib/hr-data";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { StatCard } from "@/components/ui/stat-card";

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

  const adjustmentQueues = useRef(new Map<string, Promise<void>>());
  const adjustmentRevisions = useRef(new Map<string, number>());
  const confirmedWages = useRef(new Map<string, WageRecord>());

  // 1. Fetch Existing Calculated Wages for Year & Month
  const fetchWagesForPeriod = useCallback(async (yr: number, m: number) => {
    try {
      const res = await fetch(`/api/salary/calculate?year=${yr}&month=${m}`);
      if (res.ok) {
        const data = await res.json();
        for (const record of data || []) confirmedWages.current.set(record.id, record);
        setWages(data || []);
      }
    } catch (e) {
      console.error("Failed to load period wages", e);
    }
  }, []);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchWagesForPeriod(year, month);
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
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
        for (const record of data) confirmedWages.current.set(record.id, record);
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

  // Per-row queues preserve typing order even when earlier requests respond slowly.
  const handleRowAdjustment = async (wage: WageRecord, field: "bonus" | "deductions", val: number) => {
    if (!confirmedWages.current.has(wage.id)) confirmedWages.current.set(wage.id, wage);
    const revision = (adjustmentRevisions.current.get(wage.id) || 0) + 1;
    adjustmentRevisions.current.set(wage.id, revision);
    const numericVal = Math.max(0, Number(val) || 0);
    const updated = { ...wage, [field]: numericVal };
    updated.netSalary = Math.max(0, updated.grossSalary + updated.bonus - updated.deductions);
    setWages((previous) => previous.map((row) => (row.id === wage.id ? updated : row)));
    const previous = adjustmentQueues.current.get(wage.id) || Promise.resolve();
    const pending = previous
      .catch(() => {})
      .then(async () => {
        const response = await fetch(`/api/salary/pay/${wage.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: numericVal }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to save salary adjustment.");
        confirmedWages.current.set(wage.id, data);
        if (adjustmentRevisions.current.get(wage.id) === revision) {
          setWages((rows) => rows.map((row) => (row.id === wage.id ? data : row)));
        }
      })
      .catch((error) => {
        if (adjustmentRevisions.current.get(wage.id) !== revision) return;
        const confirmed = confirmedWages.current.get(wage.id)!;
        setWages((rows) => rows.map((row) => (row.id === wage.id ? confirmed : row)));
        setMsg({ type: "error", text: getErrorMessage(error) || "Unable to save salary adjustment." });
      });
    adjustmentQueues.current.set(wage.id, pending);
    await pending;
    if (adjustmentQueues.current.get(wage.id) === pending) adjustmentQueues.current.delete(wage.id);
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
    <PageContainer>
      <PageHeader
        title="Salary & Wages Engine"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Staff Roster", href: "/employees" },
          { label: "Salary Calculation" },
        ]}
        actions={
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#64748B]" /> Print Payslips
          </button>
        }
      />

      {msg && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#174D3C] shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Gross Payroll"
          value={`₹${totalGross.toLocaleString()}`}
          subtitle={`${wages.length} calculated payslips`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Bonuses"
          value={`₹${totalBonus.toLocaleString()}`}
          subtitle="Incentives added"
          isPositive={true}
        />
        <StatCard
          title="Total Deductions"
          value={`₹${totalDeductions.toLocaleString()}`}
          subtitle="Advances & penalties"
        />
        <StatCard
          title="Net Payable Sum"
          value={`₹${totalNet.toLocaleString()}`}
          subtitle="Total disbursement"
        />
      </div>

      {/* Period Selector & Trigger Card */}
      <ContentCard>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#64748B]">Month:</span>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#64748B]">Year:</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#64748B]">Standard Days:</span>
              <input
                type="number"
                min="1"
                max="31"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="w-14 p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827] text-center"
              />
            </div>
          </div>

          <button
            onClick={handleCompute}
            disabled={loading}
            className="px-4 py-2 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Calculator className="w-3.5 h-3.5" />
            {loading ? "Computing..." : `Calculate Salaries for ${monthNames[month - 1]}`}
          </button>
        </div>
      </ContentCard>

      {/* Salary Results Table Card */}
      <ContentCard
        title="Payroll Calculation Register"
        badge={`${wages.length} records`}
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Employee</th>
                <th className="py-2.5 px-4 font-medium">Designation</th>
                <th className="py-2.5 px-4 font-medium">Wage Rate</th>
                <th className="py-2.5 px-4 font-medium text-center">Days Present</th>
                <th className="py-2.5 px-4 font-medium text-right">Gross (₹)</th>
                <th className="py-2.5 px-4 font-medium text-center">Bonus (₹)</th>
                <th className="py-2.5 px-4 font-medium text-center">Deductions (₹)</th>
                <th className="py-2.5 px-4 font-medium text-right">Net Salary (₹)</th>
                <th className="py-2.5 px-4 font-medium text-center">Status</th>
                <th className="py-2.5 px-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
              {wages.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 px-4 text-center text-[#64748B]">
                    No salary records calculated for {monthNames[month - 1]} {year}. Click &quot;Calculate Salaries&quot; above to compute payroll from attendance logs.
                  </td>
                </tr>
              ) : (
                wages.map((w) => (
                  <tr key={w.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#111827] text-xs">{w.employeeName}</td>
                    <td className="py-3 px-4 text-[#475569] text-xs">{w.roleName}</td>
                    <td className="py-3 px-4 text-[#475569] font-mono text-xs">
                      ₹{Number(w.wageRate).toLocaleString()}{" "}
                      <span className="text-[10px] text-[#94A3B8]">({w.wageType})</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-[#111827] text-xs">
                      {w.presentDays} / {w.workingDays} d
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#111827] text-xs">
                      ₹{Number(w.grossSalary).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        aria-label={`Bonus for ${w.employeeName}`}
                        value={w.bonus || ""}
                        placeholder="0"
                        onChange={(e) => handleRowAdjustment(w, "bonus", Number(e.target.value))}
                        className="w-18 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-center font-semibold text-[#174D3C] text-xs focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                      />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        aria-label={`Deductions for ${w.employeeName}`}
                        value={w.deductions || ""}
                        placeholder="0"
                        onChange={(e) => handleRowAdjustment(w, "deductions", Number(e.target.value))}
                        className="w-18 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-center font-semibold text-rose-700 text-xs focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                      />
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#174D3C] text-xs">
                      ₹{Number(w.netSalary).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          w.status === "PAID"
                            ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {w.status !== "PAID" ? (
                        <button
                          id={`pay-btn-${w.id}`}
                          onClick={() => openPayModal(w)}
                          className="px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#174D3C] border border-[#C5DEC8] hover:border-[#174D3C] font-medium rounded-md text-xs transition-colors shadow-2xs"
                        >
                          Settle Pay
                        </button>
                      ) : (
                        <div className="text-[11px] text-[#174D3C] font-medium flex items-center justify-center gap-1">
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
              <tfoot className="bg-[#F8FAFC] font-semibold border-t border-[#E2E8F0] text-[#111827]">
                <tr>
                  <td colSpan={4} className="py-2.5 px-4 uppercase text-[11px] tracking-wider text-right text-[#64748B]">
                    Payroll Totals:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs">₹{totalGross.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-xs text-[#174D3C]">+₹{totalBonus.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-xs text-rose-700">-₹{totalDeductions.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs font-bold text-[#174D3C]">
                    ₹{totalNet.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </ContentCard>

      {/* Settlement Payment Modal */}
      {isPayModalOpen && selectedWage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-sm font-semibold text-[#111827]">Settle Salary Payment</h3>
                <p className="text-xs text-[#64748B]">
                  {selectedWage.employeeName} &bull; {monthNames[selectedWage.month - 1]} {selectedWage.year}
                </p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-[#64748B] hover:text-[#111827] text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#EAF3EE] rounded-lg border border-[#C5DEC8] flex items-center justify-between">
                <span className="text-[#64748B] font-medium">Net Payout Amount:</span>
                <span className="text-sm font-bold text-[#174D3C] font-mono">
                  ₹{Number(selectedWage.netSalary).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Disbursement Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Payment Channel</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cash">Cash Voucher</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Reference / UTR Number</label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Notes & Settlement Remarks</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors"
                >
                  Confirm & Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
