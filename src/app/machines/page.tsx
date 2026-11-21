"use client";

import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ContentCard } from "@/components/ui/content-card";
import {
  CropCycleItem,
  MachineItem,
  MachineType,
  MachineUsageLogItem,
  PlotItem,
  WorkerItem,
} from "@/lib/db-storage";
import { MachineReportSummary, PlotMachineReportSummary } from "@/lib/machinery-data";
import {
  CheckCircle2,
    Edit2,
    Plus,
  RefreshCw,
  Search,
  Tractor,
  Trash2,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export default function MachinesRegisterPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState<"logs" | "directory" | "machine_report" | "plot_report">("logs");

  // Filter States
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>("ALL");
  const [selectedPlotFilter, setSelectedPlotFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data States
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [usageLogs, setUsageLogs] = useState<MachineUsageLogItem[]>([]);
  const [machineReports, setMachineReports] = useState<MachineReportSummary[]>([]);
  const [plotReports, setPlotReports] = useState<PlotMachineReportSummary[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [cropCycles, setCropCycles] = useState<CropCycleItem[]>([]);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [showMachineModal, setShowMachineModal] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<MachineUsageLogItem | null>(null);
  const [editingMachine, setEditingMachine] = useState<MachineItem | null>(null);

  // Form States for Log
  const [logForm, setLogForm] = useState<{
    machineId: string;
    date: string;
    plotId: string;
    cropCycleId: string;
    workerId: string;
    operatorName: string;
    startTime: string;
    endTime: string;
    hoursUsed: string;
    workDescription: string;
    fuelCost: string;
    maintenanceCost: string;
  }>({
    machineId: "",
    date: todayStr,
    plotId: "",
    cropCycleId: "",
    workerId: "",
    operatorName: "",
    startTime: "08:00",
    endTime: "12:00",
    hoursUsed: "4",
    workDescription: "",
    fuelCost: "0",
    maintenanceCost: "0",
  });

  // Form States for Machine
  const [machineForm, setMachineForm] = useState<{
    name: string;
    type: MachineType;
    registrationNumber: string;
    fuelType: string;
    active: boolean;
    notes: string;
  }>({
    name: "",
    type: "TRACTOR",
    registrationNumber: "",
    fuelType: "Diesel",
    active: true,
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [machRes, usageRes, machRepRes, plotRepRes, plotRes, cycleRes, workerRes] =
        await Promise.all([
          fetch("/api/machines"),
          fetch("/api/machines/usage"),
          fetch("/api/machines/reports?type=machines"),
          fetch("/api/machines/reports?type=plots"),
          fetch("/api/plots"),
          fetch("/api/crop-cycles"),
          fetch("/api/workers"),
        ]);

      const [machData, usageData, machRepData, plotRepData, plotData, cycleData, workerData] =
        await Promise.all([
          machRes.json(),
          usageRes.json(),
          machRepRes.json(),
          plotRepRes.json(),
          plotRes.json(),
          cycleRes.json(),
          workerRes.json(),
        ]);

      if (machData.success) setMachines(machData.data);
      if (usageData.success) setUsageLogs(usageData.data);
      if (machRepData.success) setMachineReports(machRepData.data);
      if (plotRepData.success) setPlotReports(plotRepData.data);
      if (plotData.success) setPlots(plotData.data);
      if (cycleData.success) setCropCycles(cycleData.data);
      if (workerData.success) setWorkers(workerData.data);
    } catch (err) {
      console.error("Failed to load machinery data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchData();
      })();
    }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
  }, [fetchData]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.machineId || !logForm.date || !logForm.workDescription) {
      alert("Please fill in Machine, Date, and Work Description.");
      return;
    }

    try {
      const payload = {
        ...logForm,
        hoursUsed: parseFloat(logForm.hoursUsed) || 1,
        fuelCost: parseFloat(logForm.fuelCost) || 0,
        maintenanceCost: parseFloat(logForm.maintenanceCost) || 0,
        plotId: logForm.plotId || undefined,
        cropCycleId: logForm.cropCycleId || undefined,
        workerId: logForm.workerId || undefined,
      };

      const res = await fetch("/api/machines/usage", {
        method: editingLog ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingLog ? { id: editingLog.id, ...payload } : payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowLogModal(false);
        setEditingLog(null);
        fetchData();
      } else {
        alert(data.error || "Failed to save usage log");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving log");
    }
  };

  const handleMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineForm.name.trim()) {
      alert("Machine name is required.");
      return;
    }

    try {
      const url = editingMachine ? `/api/machines/${editingMachine.id}` : "/api/machines";
      const method = editingMachine ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(machineForm),
      });

      const data = await res.json();
      if (data.success) {
        setShowMachineModal(false);
        setEditingMachine(null);
        fetchData();
      } else {
        alert(data.error || "Failed to save machine");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving machine");
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this usage log? Any synced crop expense will also be removed.")) {
      return;
    }
    try {
      const res = await fetch(`/api/machines/usage?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete log");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewLogModal = () => {
    setEditingLog(null);
    setLogForm({
      machineId: machines[0]?.id || "",
      date: todayStr,
      plotId: "",
      cropCycleId: "",
      workerId: "",
      operatorName: "",
      startTime: "08:00",
      endTime: "12:00",
      hoursUsed: "4",
      workDescription: "",
      fuelCost: "0",
      maintenanceCost: "0",
    });
    setShowLogModal(true);
  };

  const openEditLogModal = (log: MachineUsageLogItem) => {
    setEditingLog(log);
    setLogForm({
      machineId: log.machineId,
      date: log.date,
      plotId: log.plotId || "",
      cropCycleId: log.cropCycleId || "",
      workerId: log.workerId || "",
      operatorName: log.operatorName || "",
      startTime: log.startTime || "08:00",
      endTime: log.endTime || "12:00",
      hoursUsed: String(log.hoursUsed),
      workDescription: log.workDescription,
      fuelCost: String(log.fuelCost || 0),
      maintenanceCost: String(log.maintenanceCost || 0),
    });
    setShowLogModal(true);
  };

  const openNewMachineModal = () => {
    setEditingMachine(null);
    setMachineForm({
      name: "",
      type: "TRACTOR",
      registrationNumber: "",
      fuelType: "Diesel",
      active: true,
      notes: "",
    });
    setShowMachineModal(true);
  };

  const openEditMachineModal = (m: MachineItem) => {
    setEditingMachine(m);
    setMachineForm({
      name: m.name,
      type: m.type,
      registrationNumber: m.registrationNumber || "",
      fuelType: m.fuelType || "Diesel",
      active: m.active,
      notes: m.notes || "",
    });
    setShowMachineModal(true);
  };

  const totalFleetCount = machines.length;
  const activeFleetCount = machines.filter((m) => m.active).length;
  const totalHoursLogged = usageLogs.reduce((acc, l) => acc + (Number(l.hoursUsed) || 0), 0);
  const totalFuelExp = usageLogs.reduce((acc, l) => acc + (Number(l.fuelCost) || 0), 0);
  const totalMaintExp = usageLogs.reduce((acc, l) => acc + (Number(l.maintenanceCost) || 0), 0);
  const totalOperatingCost = totalFuelExp + totalMaintExp;

  const filteredLogs = usageLogs.filter((log) => {
    if (selectedMachineFilter !== "ALL" && log.machineId !== selectedMachineFilter) return false;
    if (selectedPlotFilter !== "ALL" && log.plotId !== selectedPlotFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = log.workDescription.toLowerCase().includes(q);
      const matchMach = (log.machineName || "").toLowerCase().includes(q);
      const matchOp = (log.operatorName || "").toLowerCase().includes(q);
      const matchPlot = (log.plotName || "").toLowerCase().includes(q);
      if (!matchDesc && !matchMach && !matchOp && !matchPlot) return false;
    }
    return true;
  });

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Machinery & Vehicle Register"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Plot Operations", href: "/items" },
          { label: "Machinery Register" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchData()}
              title="Refresh"
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-estate-primary" : ""}`} />
            </button>
            <button
              id="btn-register-machine-header"
              onClick={openNewMachineModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-estate-primary" />
              Register Machine
            </button>
            <button
              onClick={openNewLogModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-estate-primary hover:bg-estate-primary-hover text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log Work Done
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Fleet"
          value={`${activeFleetCount} / ${totalFleetCount}`}
          subtitle="Operational equipment"
        />
        <StatCard
          title="Total Hours Logged"
          value={`${Math.round(totalHoursLogged * 10) / 10} hrs`}
          subtitle="Lifetime equipment time"
        />
        <StatCard
          title="Diesel & Fuel Cost"
          value={`₹${totalFuelExp.toLocaleString()}`}
          subtitle="Recorded energy spend"
        />
        <StatCard
          title="Total Operating Cost"
          value={`₹${totalOperatingCost.toLocaleString()}`}
          subtitle="Fuel + maintenance sync"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "logs"
              ? "border-estate-primary text-estate-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Daily Usage Logs ({usageLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "directory"
              ? "border-estate-primary text-estate-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Machinery Register ({machines.length})
        </button>
        <button
          onClick={() => setActiveTab("machine_report")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "machine_report"
              ? "border-estate-primary text-estate-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Equipment Summary Report
        </button>
        <button
          onClick={() => setActiveTab("plot_report")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "plot_report"
              ? "border-estate-primary text-estate-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Per-Plot Consumption Report
        </button>
      </div>

      {/* TAB 1: USAGE LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <ContentCard noPadding>
            {/* Filter Bar */}
            <div className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search work, operator, machine..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary focus:bg-white transition-colors"
                  />
                </div>

                <select
                  value={selectedMachineFilter}
                  onChange={(e) => setSelectedMachineFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary"
                >
                  <option value="ALL">All Machines</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPlotFilter}
                  onChange={(e) => setSelectedPlotFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary"
                >
                  <option value="ALL">All Plots</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500 font-medium self-end md:self-center">
                Showing <span className="font-semibold text-slate-900">{filteredLogs.length}</span> logs
              </div>
            </div>

            {/* Usage Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs erp-table">
                <thead>
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Machine & Type</th>
                    <th className="p-3">Plot / Crop</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Work Description</th>
                    <th className="p-3 text-center">Hours</th>
                    <th className="p-3 text-right">Fuel Spend</th>
                    <th className="p-3 text-right">Maint. Spend</th>
                    <th className="p-3 text-center">Crop Sync</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400">
                        <Tractor className="w-9 h-9 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="font-semibold text-sm text-slate-700">No machinery usage logs found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Log equipment runs using the &ldquo;Log Work Done&rdquo; button.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const totalOp = (Number(log.fuelCost) || 0) + (Number(log.maintenanceCost) || 0);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 whitespace-nowrap font-medium text-slate-900">{log.date}</td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{log.machineName}</div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                              {log.machineType}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-medium text-slate-900">{log.plotName || "—"}</div>
                            {log.cropName && (
                              <div className="text-[11px] text-estate-primary font-medium">
                                {log.cropName}
                              </div>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-600">
                            {log.operatorName || "Unassigned"}
                          </td>
                          <td className="p-3 max-w-xs truncate text-slate-800" title={log.workDescription}>
                            {log.workDescription}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap font-semibold text-slate-900">
                            {log.hoursUsed} hrs
                          </td>
                          <td className="p-3 text-right whitespace-nowrap text-amber-700 font-mono">
                            ₹{(Number(log.fuelCost) || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap text-purple-700 font-mono">
                            ₹{(Number(log.maintenanceCost) || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {log.cropCycleId ? (
                              <span
                                title={`Synced to Crop Cycle: ₹${totalOp}`}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Synced
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Unlinked</span>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => openEditLogModal(log)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md transition-colors"
                              title="Edit Log"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded-md transition-colors"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </ContentCard>
        </div>
      )}

      {/* TAB 2: DIRECTORY */}
      {activeTab === "directory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-estate-subtle flex items-center justify-center text-estate-primary">
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{m.name}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {m.type}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      m.active
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {m.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Registration:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {m.registrationNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Fuel Type:</span>
                    <span className="font-semibold text-slate-900">{m.fuelType || "Diesel"}</span>
                  </div>
                  {m.notes && (
                    <div className="mt-2 text-slate-600 text-[11px] bg-slate-50 border border-slate-100 p-2 rounded-lg italic">
                      &quot;{m.notes}&quot;
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setLogForm({
                      machineId: m.id,
                      date: todayStr,
                      plotId: "",
                      cropCycleId: "",
                      workerId: "",
                      operatorName: "",
                      startTime: "08:00",
                      endTime: "12:00",
                      hoursUsed: "4",
                      workDescription: "",
                      fuelCost: "0",
                      maintenanceCost: "0",
                    });
                    setShowLogModal(true);
                  }}
                  className="text-xs text-estate-primary hover:text-estate-primary-hover font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Use
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditMachineModal(m)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md transition-colors"
                    title="Edit Machine"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MACHINE CONSUMPTION REPORT */}
      {activeTab === "machine_report" && (
        <ContentCard
          title="Equipment Operating & Cost Summary"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs erp-table">
              <thead>
                <tr>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Usage Count</th>
                  <th className="p-3 text-center">Total Hours</th>
                  <th className="p-3 text-right">Fuel Cost</th>
                  <th className="p-3 text-right">Maint. Cost</th>
                  <th className="p-3 text-right">Total Operating Cost</th>
                </tr>
              </thead>
              <tbody>
                {machineReports.map((r) => (
                  <tr key={r.machineId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{r.machineName}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {r.machineType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          r.active
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-center font-medium text-slate-800">{r.totalUsageCount} runs</td>
                    <td className="p-3 text-center font-semibold text-estate-primary">
                      {r.totalHoursUsed} hrs
                    </td>
                    <td className="p-3 text-right font-mono text-amber-700">
                      ₹{r.totalFuelCost.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-purple-700">
                      ₹{r.totalMaintenanceCost.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      ₹{r.totalOperatingCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}

      {/* TAB 4: PLOT CONSUMPTION REPORT */}
      {activeTab === "plot_report" && (
        <ContentCard
          title="Per-Plot Machinery Usage & Allocation"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs erp-table">
              <thead>
                <tr>
                  <th className="p-3">Target Plot</th>
                  <th className="p-3 text-center">Plot Runs</th>
                  <th className="p-3 text-center">Hours Worked</th>
                  <th className="p-3 text-right">Direct Cost</th>
                  <th className="p-3">Equipment Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {plotReports.map((pr) => (
                  <tr key={pr.plotId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{pr.plotName}</td>
                    <td className="p-3 text-center font-medium text-slate-800">{pr.totalUsageCount} runs</td>
                    <td className="p-3 text-center font-semibold text-estate-primary">{pr.totalHoursUsed} hrs</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      ₹{(pr.totalCost ?? pr.totalOperatingCost ?? 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {pr.machineBreakdown.length === 0 ? (
                          <span className="text-slate-400 italic">None logged</span>
                        ) : (
                          pr.machineBreakdown.map((b) => (
                            <span
                              key={b.machineId}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {b.machineName} ({b.hoursUsed}h, ₹{b.operatingCost})
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}

      {/* MODAL: LOG MACHINE USAGE */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tractor className="w-4 h-4 text-estate-primary" />
                {editingLog ? "Edit Machine Usage Log" : "Log Machine Work Done"}
              </h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Equipment *</label>
                  <select
                    value={logForm.machineId}
                    onChange={(e) => setLogForm({ ...logForm, machineId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  >
                    <option value="">Select Equipment</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Date *</label>
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Plot Link</label>
                  <select
                    value={logForm.plotId}
                    onChange={(e) => setLogForm({ ...logForm, plotId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  >
                    <option value="">General Estate / None</option>
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Crop Cycle (Auto P&L Sync)</label>
                  <select
                    value={logForm.cropCycleId}
                    onChange={(e) => setLogForm({ ...logForm, cropCycleId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  >
                    <option value="">None (No Crop Sync)</option>
                    {cropCycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.plotName} - {c.cropName} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Operator (Worker)</label>
                  <select
                    value={logForm.workerId}
                    onChange={(e) => {
                      const w = workers.find((item) => item.id === e.target.value);
                      setLogForm({
                        ...logForm,
                        workerId: e.target.value,
                        operatorName: w ? w.name : logForm.operatorName,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  >
                    <option value="">Select Farm Worker</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role || "Worker"})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Or Operator Name</label>
                  <input
                    type="text"
                    placeholder="External driver / contractor"
                    value={logForm.operatorName}
                    onChange={(e) => setLogForm({ ...logForm, operatorName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    value={logForm.startTime}
                    onChange={(e) => setLogForm({ ...logForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">End Time</label>
                  <input
                    type="time"
                    value={logForm.endTime}
                    onChange={(e) => setLogForm({ ...logForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Hours Used *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={logForm.hoursUsed}
                    onChange={(e) => setLogForm({ ...logForm, hoursUsed: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Work Done Description *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Rotavator tilling for seed bed prep, ridge cutting, high pressure spraying..."
                  value={logForm.workDescription}
                  onChange={(e) => setLogForm({ ...logForm, workDescription: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Fuel Spend (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={logForm.fuelCost}
                    onChange={(e) => setLogForm({ ...logForm, fuelCost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Maintenance / Repair (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={logForm.maintenanceCost}
                    onChange={(e) => setLogForm({ ...logForm, maintenanceCost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              <div className="bg-estate-subtle/50 p-3 rounded-lg text-xs text-estate-primary border border-estate-primary/20">
                💡 <strong>Idempotent Crop Sync:</strong> If a Crop Cycle is selected, fuel + maintenance costs (₹
                {(parseFloat(logForm.fuelCost) || 0) + (parseFloat(logForm.maintenanceCost) || 0)}) will automatically roll up under <strong>MACHINERY</strong> in the crop ledger.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-estate-primary hover:bg-estate-primary-hover text-white text-xs font-semibold shadow-xs"
                >
                  {editingLog ? "Save Changes" : "Create Usage Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER / EDIT MACHINE */}
      {showMachineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tractor className="w-4 h-4 text-estate-primary" />
                {editingMachine ? "Edit Equipment Details" : "Register Farm Equipment"}
              </h2>
              <button
                onClick={() => setShowMachineModal(false)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMachineSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Equipment Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Deere 5050D, VST Shakti Power Tiller"
                  value={machineForm.name}
                  onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Category / Type</label>
                  <select
                    value={machineForm.type}
                    onChange={(e) => setMachineForm({ ...machineForm, type: e.target.value as MachineType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  >
                    <option value="TRACTOR">Tractor</option>
                    <option value="TILLER">Power Tiller</option>
                    <option value="SPRAYER">Sprayer</option>
                    <option value="PUMP">Pump / Motor</option>
                    <option value="HARVESTER">Harvester</option>
                    <option value="VEHICLE">Vehicle / Truck</option>
                    <option value="DRONE">Drone</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Fuel / Power</label>
                  <input
                    type="text"
                    placeholder="Diesel, Petrol, Electric"
                    value={machineForm.fuelType}
                    onChange={(e) => setMachineForm({ ...machineForm, fuelType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Registration / Serial No.</label>
                <input
                  type="text"
                  placeholder="TN-38-BZ-4412"
                  value={machineForm.registrationNumber}
                  onChange={(e) => setMachineForm({ ...machineForm, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-estate-primary text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Notes / Attachments</label>
                <textarea
                  rows={2}
                  placeholder="Attachments available, maintenance schedule notes..."
                  value={machineForm.notes}
                  onChange={(e) => setMachineForm({ ...machineForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="machine_active_flag"
                  checked={machineForm.active}
                  onChange={(e) => setMachineForm({ ...machineForm, active: e.target.checked })}
                  className="rounded border-slate-300 text-estate-primary focus:ring-estate-primary"
                />
                <label htmlFor="machine_active_flag" className="text-slate-700 cursor-pointer select-none text-xs font-medium">
                  Currently active and operational
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMachineModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-machine-modal"
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-estate-primary hover:bg-estate-primary-hover text-white text-xs font-semibold shadow-xs"
                >
                  {editingMachine ? "Save Changes" : "Register Machine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
