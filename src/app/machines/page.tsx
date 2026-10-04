"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Tractor,
  Calendar,
  Clock,
  Fuel,
  Wrench,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  MapPin,
  Sprout,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import {
  MachineItem,
  MachineUsageLogItem,
  MachineType,
  CropCycleItem,
  PlotItem,
  WorkerItem,
} from "@/lib/db-storage";
import { MachineReportSummary, PlotMachineReportSummary } from "@/lib/machinery-data";

export default function MachinesRegisterPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState<"logs" | "directory" | "machine_report" | "plot_report">("logs");

  // Filter States
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
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
    fetchData();
  }, [fetchData]);

  // Handle Log submit
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

  // Handle Machine submit
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

  // Handle Log Delete
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

  // Quick Open Modal helpers
  const openNewLogModal = () => {
    setEditingLog(null);
    setLogForm({
      machineId: machines[0]?.id || "",
      date: selectedDate,
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

  // KPI Calculations
  const totalFleetCount = machines.length;
  const activeFleetCount = machines.filter((m) => m.active).length;
  const totalHoursLogged = usageLogs.reduce((acc, l) => acc + (Number(l.hoursUsed) || 0), 0);
  const totalFuelExp = usageLogs.reduce((acc, l) => acc + (Number(l.fuelCost) || 0), 0);
  const totalMaintExp = usageLogs.reduce((acc, l) => acc + (Number(l.maintenanceCost) || 0), 0);
  const totalOperatingCost = totalFuelExp + totalMaintExp;

  // Filtered Logs
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
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Fleet & Equipment
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Tractor className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            Machinery & Vehicle Register
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-register-machine-header"
            onClick={openNewMachineModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted text-foreground shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            Register Machine
          </button>
          <button
            onClick={openNewLogModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Work Done
          </button>
          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 border border-border rounded-lg bg-card hover:bg-muted text-muted-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Fleet"
          value={`${activeFleetCount} / ${totalFleetCount}`}
          description="Operational equipment"
          icon={<Tractor className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Total Hours Logged"
          value={`${Math.round(totalHoursLogged * 10) / 10} hrs`}
          description="Lifetime equipment time"
          icon={<Clock className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Diesel & Fuel Cost"
          value={`₹${totalFuelExp.toLocaleString()}`}
          description="Recorded energy spend"
          icon={<Fuel className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="Total Operating Cost"
          value={`₹${totalOperatingCost.toLocaleString()}`}
          description="Fuel + maintenance sync"
          icon={<Wrench className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/40 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "logs"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Daily Usage Logs ({usageLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "directory"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Machinery Register ({machines.length})
        </button>
        <button
          onClick={() => setActiveTab("machine_report")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "machine_report"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Equipment Summary Report
        </button>
        <button
          onClick={() => setActiveTab("plot_report")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "plot_report"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Per-Plot Consumption Report
        </button>
      </div>

      {/* TAB 1: USAGE LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search work, operator, machine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={selectedMachineFilter}
                onChange={(e) => setSelectedMachineFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Plots</option>
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted-foreground self-end md:self-center">
              Showing <span className="font-semibold text-foreground">{filteredLogs.length}</span> logs
            </div>
          </div>

          {/* Usage Logs Table */}
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Machine & Type</th>
                    <th className="py-3 px-4">Plot / Crop</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Work Description</th>
                    <th className="py-3 px-4 text-center">Hours</th>
                    <th className="py-3 px-4 text-right">Fuel Spend</th>
                    <th className="py-3 px-4 text-right">Maint. Spend</th>
                    <th className="py-3 px-4 text-center">Crop Sync</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-muted-foreground">
                        <Tractor className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No machinery usage logs found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const totalOp = (Number(log.fuelCost) || 0) + (Number(log.maintenanceCost) || 0);
                      return (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                            {log.date}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium text-foreground">{log.machineName}</div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-mono">
                              {log.machineType}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium text-foreground">{log.plotName || "—"}</div>
                            {log.cropName && (
                              <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                {log.cropName}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                            {log.operatorName || "Unassigned"}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-foreground" title={log.workDescription}>
                            {log.workDescription}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap font-semibold">
                            {log.hoursUsed} hrs
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap text-amber-600 dark:text-amber-400 font-mono">
                            ₹{(Number(log.fuelCost) || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap text-purple-600 dark:text-purple-400 font-mono">
                            ₹{(Number(log.maintenanceCost) || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {log.cropCycleId ? (
                              <span
                                title={`Synced to Crop Cycle: ₹${totalOp}`}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Synced
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60 text-[11px]">Unlinked</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => openEditLogModal(log)}
                              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                              title="Edit Log"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-muted-foreground hover:text-rose-600 rounded"
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
          </div>
        </div>
      )}

      {/* TAB 2: DIRECTORY */}
      {activeTab === "directory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((m) => (
            <div
              key={m.id}
              className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm leading-tight">{m.name}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {m.type}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      m.active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Registration:</span>
                    <span className="font-mono font-medium text-foreground">
                      {m.registrationNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Fuel Type:</span>
                    <span className="font-medium text-foreground">{m.fuelType || "Diesel"}</span>
                  </div>
                  {m.notes && (
                    <div className="mt-2 text-muted-foreground text-[11px] bg-muted/40 p-2 rounded-lg italic">
                      "{m.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
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
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Use
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditMachineModal(m)}
                    className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
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
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20">
            <h3 className="font-semibold text-foreground text-sm">
              Equipment Operating & Cost Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Usage Count</th>
                  <th className="py-3 px-4 text-center">Total Hours</th>
                  <th className="py-3 px-4 text-right">Fuel Cost</th>
                  <th className="py-3 px-4 text-right">Maint. Cost</th>
                  <th className="py-3 px-4 text-right">Total Operating Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {machineReports.map((r) => (
                  <tr key={r.machineId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{r.machineName}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {r.machineType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          r.active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{r.totalUsageCount} runs</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-600 dark:text-blue-400">
                      {r.totalHoursUsed} hrs
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                      ₹{r.totalFuelCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-purple-600 dark:text-purple-400">
                      ₹{r.totalMaintenanceCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      ₹{r.totalOperatingCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PER-PLOT CONSUMPTION REPORT */}
      {activeTab === "plot_report" && (
        <div className="space-y-4">
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/60 bg-muted/20">
              <h3 className="font-semibold text-foreground text-sm">
                Plot-Wise Machinery Consumption & Cost Allocation
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Plot Name</th>
                    <th className="py-3 px-4 text-center">Total Runs</th>
                    <th className="py-3 px-4 text-center">Hours Worked</th>
                    <th className="py-3 px-4 text-right">Fuel Spend</th>
                    <th className="py-3 px-4 text-right">Maint. Spend</th>
                    <th className="py-3 px-4 text-right">Total Plot Cost</th>
                    <th className="py-3 px-4">Equipment Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {plotReports.map((p) => (
                    <tr key={p.plotId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{p.plotName}</td>
                      <td className="py-3 px-4 text-center font-medium">{p.totalUsageCount}</td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600 dark:text-blue-400">
                        {p.totalHoursUsed} hrs
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                        ₹{p.totalFuelCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-purple-600 dark:text-purple-400">
                        ₹{p.totalMaintenanceCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        ₹{p.totalOperatingCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.machineBreakdown.length === 0 ? (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          ) : (
                            p.machineBreakdown.map((b) => (
                              <span
                                key={b.machineId}
                                className="text-[10px] px-2 py-0.5 rounded bg-muted text-foreground"
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
          </div>
        </div>
      )}

      {/* MODAL: LOG MACHINE USAGE */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Tractor className="w-5 h-5 text-emerald-600" />
                {editingLog ? "Edit Machine Usage Log" : "Log Machine Work Done"}
              </h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Equipment *</label>
                  <select
                    value={logForm.machineId}
                    onChange={(e) => setLogForm({ ...logForm, machineId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select Equipment</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Date *</label>
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Plot Link</label>
                  <select
                    value={logForm.plotId}
                    onChange={(e) => setLogForm({ ...logForm, plotId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">General Estate / None</option>
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Crop Cycle (Auto P&L Sync)</label>
                  <select
                    value={logForm.cropCycleId}
                    onChange={(e) => setLogForm({ ...logForm, cropCycleId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
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
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Operator (Worker)</label>
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
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select Farm Worker</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.role || "Worker"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Or Operator Name</label>
                  <input
                    type="text"
                    placeholder="External driver / contractor"
                    value={logForm.operatorName}
                    onChange={(e) => setLogForm({ ...logForm, operatorName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Start Time</label>
                  <input
                    type="time"
                    value={logForm.startTime}
                    onChange={(e) => setLogForm({ ...logForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">End Time</label>
                  <input
                    type="time"
                    value={logForm.endTime}
                    onChange={(e) => setLogForm({ ...logForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Hours Used *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={logForm.hoursUsed}
                    onChange={(e) => setLogForm({ ...logForm, hoursUsed: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Work Done Description *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Rotavator tilling for seed bed prep, ridge cutting, high pressure spraying..."
                  value={logForm.workDescription}
                  onChange={(e) => setLogForm({ ...logForm, workDescription: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Fuel Spend (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={logForm.fuelCost}
                    onChange={(e) => setLogForm({ ...logForm, fuelCost: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Maintenance / Repair (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={logForm.maintenanceCost}
                    onChange={(e) => setLogForm({ ...logForm, maintenanceCost: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                💡 <strong>Idempotent Crop Sync:</strong> If a Crop Cycle is selected, fuel + maintenance costs (₹
                {(parseFloat(logForm.fuelCost) || 0) + (parseFloat(logForm.maintenanceCost) || 0)}) will automatically roll up under <strong>MACHINERY</strong> in the crop ledger.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Tractor className="w-5 h-5 text-emerald-600" />
                {editingMachine ? "Edit Equipment Details" : "Register Farm Equipment"}
              </h2>
              <button
                onClick={() => setShowMachineModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMachineSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Equipment Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Deere 5050D, VST Shakti Power Tiller"
                  value={machineForm.name}
                  onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Category / Type</label>
                  <select
                    value={machineForm.type}
                    onChange={(e) => setMachineForm({ ...machineForm, type: e.target.value as MachineType })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
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
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Fuel / Power</label>
                  <input
                    type="text"
                    placeholder="Diesel, Petrol, Electric"
                    value={machineForm.fuelType}
                    onChange={(e) => setMachineForm({ ...machineForm, fuelType: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Registration / Serial No.</label>
                <input
                  type="text"
                  placeholder="TN-38-BZ-4412"
                  value={machineForm.registrationNumber}
                  onChange={(e) => setMachineForm({ ...machineForm, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Notes / Attachments</label>
                <textarea
                  rows={2}
                  placeholder="Attachments available, maintenance schedule notes..."
                  value={machineForm.notes}
                  onChange={(e) => setMachineForm({ ...machineForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="machine_active_flag"
                  checked={machineForm.active}
                  onChange={(e) => setMachineForm({ ...machineForm, active: e.target.checked })}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="machine_active_flag" className="text-foreground cursor-pointer select-none">
                  Currently active and operational
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMachineModal(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-machine-modal"
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm"
                >
                  {editingMachine ? "Save Changes" : "Register Machine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
