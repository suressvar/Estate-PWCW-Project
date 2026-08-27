"use client";

import React, { useState } from "react";
import { Settings, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/reset", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setShowConfirmModal(false);
        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2000);
      } else {
        setError(data.error || "Failed to reset data.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-700" />
          <h1 className="text-xl font-bold text-slate-900">System Settings</h1>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Database & Storage</h2>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/30 gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-700" />
                Danger Zone: Wipe Application Data
              </h3>
              <p className="text-xs text-red-700 max-w-xl leading-relaxed">
                Permanently delete all in-memory operational records (Plots, Crops, Fertilizer logs, Diesel logs, Machinery usage, HR attendance & wages, Sales, and Vouchers). The system will be reset back to an empty database state.
              </p>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl border border-red-700 flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-950">Data Successfully Reset</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              All application data stores have been wiped. Redirecting to executive dashboard...
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-red-950">Error Resetting Data</h4>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950">Permanently Delete All Data?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This action is irreversible and will delete all plots, crop associations, daily logs, wages, and vouchers in the active session. Are you absolutely sure you want to proceed?
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                disabled={loading}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleResetData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded-xl border border-red-700 shadow-sm transition-colors flex items-center gap-1.5"
              >
                {loading ? "Wiping..." : "Yes, Reset All Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
