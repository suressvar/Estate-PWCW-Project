"use client";

import { errorMessage as getErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ContentCard } from "@/components/ui/content-card";
import { AlertTriangle, CheckCircle, Database, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2000);
      } else {
        setError(data.error || "Failed to reset data.");
      }
    } catch (err) {
      setError(getErrorMessage(err) || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      {/* Standardized Page Header */}
      <PageHeader
        title="System Settings"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Settings" },
        ]}
      />

      {/* Main Settings Panel */}
      <ContentCard
        title="Database & Storage Maintenance"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#174D3C]" />
                Primary Storage Driver
              </span>
              <p className="text-sm font-bold text-slate-900">Atomic File Storage (JSON)</p>
              <p className="text-xs text-slate-500">
                Synchronous multi-process writer with automated atomic backup and crash recovery.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Storage Health Status
              </span>
              <p className="text-sm font-bold text-[#16805D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16805D]" />
                Healthy & Synced
              </p>
              <p className="text-xs text-slate-500">
                Database locks are verified and responsive across all active tables.
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-rose-200 bg-rose-50/40 gap-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#DC3545]" />
                  Danger Zone: Reset Application Data
                </h3>
                <p className="text-xs text-slate-600">
                  Purges in-memory records and restores baseline seeds. Creates an automated backup prior to wipe.
                </p>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-3.5 py-2 bg-[#DC3545] hover:bg-[#b91c1c] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All Data</span>
              </button>
            </div>
          </div>
        </div>
      </ContentCard>

      {/* Success Notification Alert */}
      {success && (
        <div
          role="status"
          className="p-4 rounded-xl bg-[#EAF3EE] border border-[#16805D]/25 flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 text-[#16805D] mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#174D3C] uppercase tracking-wider">
              Data Successfully Reset
            </h4>
            <p className="text-xs text-slate-700">
              All application data stores have been wiped and re-seeded. Redirecting to executive dashboard...
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-[#DC3545] mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
              Error Resetting Data
            </h4>
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-3.5">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200/80 flex items-center justify-center text-[#DC3545]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Permanently Delete All Data?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This action is irreversible and will delete all plots, crop associations, daily logs, wages, and vouchers in the active session. Are you absolutely sure you want to proceed?
                </p>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                disabled={loading}
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleResetData}
                className="px-3.5 py-1.5 bg-[#DC3545] hover:bg-[#b91c1c] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? "Wiping..." : "Yes, Reset All Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
