"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useDashboard } from "@/components/DashboardContext";
import { ReorderAdvisorPanel } from "@/components/ReorderAdvisorPanel";
import { MedicineFormModal } from "@/components/MedicineFormModal";
import { NEARBY_RADIUS_KM } from "@/lib/stockInsights";
import { authClient } from "@/lib/auth-client";
import {
  Pill,
  Plus,
  Pencil,
  ArrowLeft,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Building2,
  Package,
  ClipboardList,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Lock,
  ShieldAlert,
  ShieldCheck,
  LogIn,
  LogOut,
  Loader2,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  critical: "Critical",
  warning: "Warning",
  low: "Low",
};

const STATUS_STYLES: Record<string, string> = {
  critical: "text-rose-400 border-rose-800/60 bg-rose-950/40",
  warning: "text-amber-400 border-amber-800/60 bg-amber-950/40",
  low: "text-emerald-400 border-emerald-800/60 bg-emerald-950/40",
};

function StatusBadge({ status }: { status: string }) {
  const Icon =
    status === "critical"
      ? XCircle
      : status === "warning"
      ? AlertTriangle
      : CheckCircle2;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
        STATUS_STYLES[status] || STATUS_STYLES.low
      }`}
    >
      <Icon className="w-3 h-3" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function InventoryPage() {
  const { drugs, inventories, facilities } = useDashboard();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [officerFacilityState, setOfficerFacilityState] = useState<{
    authenticated: boolean;
    facility: import("@/lib/db/schema").Facility | null;
    loading: boolean;
    error?: string;
  }>({
    authenticated: false,
    facility: null,
    loading: true,
  });

  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditing, setModalEditing] = useState<import("@/lib/db/schema").FacilityInventory | null>(
    null
  );

  // Query server for verified officer facility assignment
  useEffect(() => {
    if (sessionPending) return;

    if (!session?.user) {
      setOfficerFacilityState({
        authenticated: false,
        facility: null,
        loading: false,
      });
      return;
    }

    fetch("/api/user/facility")
      .then((res) => res.json())
      .then((data) => {
        setOfficerFacilityState({
          authenticated: true,
          facility: data.facility || null,
          loading: false,
          error: data.message,
        });
      })
      .catch((err) => {
        setOfficerFacilityState({
          authenticated: true,
          facility: null,
          loading: false,
          error: "Failed to verify officer facility assignment.",
        });
      });
  }, [session, sessionPending]);

  // Authorized Facility is strictly derived from user's DB record
  const authorizedFacility = officerFacilityState.facility;

  // Filter inventories exclusively for the officer's authorized hospital
  const facilityInventories = useMemo(() => {
    if (!authorizedFacility) return [];
    return inventories
      .filter((i) => i.facilityId === authorizedFacility.id)
      .sort((a, b) => {
        const riskOrder = { critical: 0, warning: 1, low: 2 };
        const ra = riskOrder[a.riskStatus as keyof typeof riskOrder] ?? 3;
        const rb = riskOrder[b.riskStatus as keyof typeof riskOrder] ?? 3;
        return ra - rb;
      });
  }, [inventories, authorizedFacility]);

  const selectedInventory =
    facilityInventories.find((i) => i.id === selectedInvId) || facilityInventories[0];
  const selectedDrug = selectedInventory
    ? drugs.find((d) => d.id === selectedInventory.drugId)
    : undefined;

  const existingDrugIds = facilityInventories.map((i) => i.drugId);

  const facilityCriticalCount = facilityInventories.filter(
    (i) => i.riskStatus === "critical"
  ).length;
  const facilityWarningCount = facilityInventories.filter(
    (i) => i.riskStatus === "warning"
  ).length;

  // =========================================================================
  // 1. LOADING STATE
  // =========================================================================
  if (sessionPending || officerFacilityState.loading) {
    return (
      <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-[#0a0a0a] border border-[#222222] shadow-2xl">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm font-mono text-neutral-300 font-bold">
            Verifying Officer Credentials...
          </p>
          <p className="text-xs font-mono text-neutral-400">
            Validating database facility assignment &amp; cryptographic session.
          </p>
        </div>
      </main>
    );
  }

  // =========================================================================
  // 2. UNAUTHENTICATED BARRIER
  // =========================================================================
  if (!session?.user) {
    return (
      <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-lg p-8 sm:p-10 rounded-2xl bg-[#090909] border border-[#222222] shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
          
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Lock className="w-6 h-6" />
          </div>

          <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-full mb-3">
            Restricted Officer Portal
          </span>

          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white mb-2 tracking-tight">
            Sign In Required
          </h1>

          <p className="text-xs sm:text-sm font-mono text-neutral-400 leading-relaxed mb-6">
            The Medicine &amp; Stock Advisor is restricted to verified healthcare facility officers.
            Please sign in to view and manage your assigned hospital&apos;s supplies, order dates, and local buffer stock.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signin"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-white text-black font-mono text-xs font-bold hover:bg-neutral-200 transition-all shadow-lg"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Officer Credentials</span>
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] border border-[#282828] text-neutral-300 hover:text-white font-mono text-xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Network Map</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // 3. AUTHENTICATED BUT NO HOSPITAL ASSIGNED IN DB
  // =========================================================================
  if (!authorizedFacility) {
    return (
      <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-lg p-8 sm:p-10 rounded-2xl bg-[#090909] border border-rose-900/40 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2.5 py-1 rounded-full mb-3">
            Access Restricted
          </span>

          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white mb-2 tracking-tight">
            No Hospital Assigned
          </h1>

          <p className="text-xs sm:text-sm font-mono text-neutral-300 leading-relaxed mb-4">
            Signed in as <strong className="text-white">{session.user.email}</strong>
          </p>

          <p className="text-xs font-mono text-neutral-400 leading-relaxed mb-6">
            Your officer account has not been provisioned with hospital management privileges in the database.
            Only designated medical superintendents and pharmacy officers have access to facility inventory telemetry.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 py-2 px-4 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] border border-[#282828] text-neutral-300 hover:text-white font-mono text-xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Network Map</span>
            </Link>
            <button
              onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}
              className="flex items-center gap-2 py-2 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/50 text-rose-300 font-mono text-xs transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // 4. AUTHORIZED OFFICER VIEW (EXCLUSIVELY FOR THEIR OWN HOSPITAL)
  // =========================================================================
  return (
    <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5 min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222222]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-[#111111] hover:bg-[#1a1a1a] border border-[#262626] text-neutral-400 hover:text-white transition-colors"
            title="Back to Network Map"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
              <h1 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                Medicine &amp; Stock Advisor
              </h1>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Authorized facility management &bull; Add/edit stock, reorder telemetry &amp; nearby-10km supply visibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Officer identity pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222222] text-xs font-mono text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="truncate max-w-[150px]">{session.user.name || session.user.email}</span>
          </div>

          <Link
            href="/"
            className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222222] hover:border-[#383838] transition-colors"
          >
            <span>Network Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Authorized Facility Locked Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#080808] border border-emerald-900/40 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-wide">
                {authorizedFacility.name}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 uppercase">
                <Lock className="w-2.5 h-2.5" />
                Your Hospital
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161616] border border-[#2b2b2b] text-neutral-300">
                {authorizedFacility.code}
              </span>
            </div>
            <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
              {authorizedFacility.facilityType} &bull; {authorizedFacility.tier} Tier &bull; {authorizedFacility.district} District &bull; {authorizedFacility.bedCapacity} Operational Beds
            </p>
          </div>
        </div>

        {/* Risk summary for this facility */}
        <div className="flex items-center gap-2 shrink-0">
          {facilityCriticalCount > 0 && (
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded font-bold">
              {facilityCriticalCount} critical
            </span>
          )}
          {facilityWarningCount > 0 && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded font-bold">
              {facilityWarningCount} warning
            </span>
          )}
          <span className="text-[10px] font-mono text-neutral-400 bg-[#121212] border border-[#222222] px-2 py-0.5 rounded">
            {facilityInventories.length} Formulations Tracked
          </span>
        </div>
      </div>

      {/* Two-column layout: Stats Table (left) | Reorder Advisor & Nearby Visibility (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Medicine Stats Table */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#080808] border border-[#222222] rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                {authorizedFacility.name} — Medicines ({facilityInventories.length})
              </span>
            </div>
            <button
              onClick={() => {
                setModalEditing(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-mono font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Medicine</span>
            </button>
          </div>

          {facilityInventories.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Pill className="w-10 h-10 text-neutral-600 mb-3" />
              <p className="text-sm font-mono text-neutral-400">
                No medicines recorded for {authorizedFacility.name} yet.
              </p>
              <p className="text-xs font-mono text-neutral-400 mt-1 mb-4">
                Click &quot;Add Medicine&quot; above to log initial clinical supply telemetry.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#1c1c1c] text-neutral-400 text-[11px] bg-[#0c0c0c]">
                    <th className="py-2.5 px-3 font-semibold">Medicine Formulation</th>
                    <th className="py-2.5 px-2 font-semibold">Stock Level</th>
                    <th className="py-2.5 px-2 font-semibold">Daily Burn</th>
                    <th className="py-2.5 px-2 font-semibold">Days Cover</th>
                    <th className="py-2.5 px-2 font-semibold">Status</th>
                    <th className="py-2.5 px-2 font-semibold">Inbound Pipeline</th>
                    <th className="py-2.5 px-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151515]">
                  {facilityInventories.map((inv) => {
                    const drug = drugs.find((d) => d.id === inv.drugId);
                    const isSelected = selectedInventory?.id === inv.id;
                    const stockVal = inv.currentStock;
                    const burnVal = inv.avgDailyConsumption;
                    const daysVal = inv.daysCover;
                    const isStockedOut = stockVal <= 0;

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvId(inv.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#181818] border-l-2 border-emerald-400"
                            : "hover:bg-[#101010]"
                        }`}
                      >
                        {/* Drug Name & Category */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              {drug?.name || inv.drugId}
                            </span>
                            {drug?.category && (
                              <span className="text-[10px] text-neutral-400 px-1.5 py-0.5 rounded bg-[#161616] border border-[#242424]">
                                {drug.category}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400">
                            Code: {drug?.code || "—"} &bull; Unit: {drug?.unit || "vials"}
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-2">
                          <span
                            className={`font-bold ${
                              isStockedOut
                                ? "text-rose-400"
                                : stockVal < inv.safetyStock
                                ? "text-amber-300"
                                : "text-white"
                            }`}
                          >
                            {stockVal}
                          </span>
                          <span className="text-[10px] text-neutral-400 ml-1">
                            {drug?.unit || "vials"}
                          </span>
                          <div className="text-[10px] text-neutral-400">
                            Safety: {inv.safetyStock}
                          </div>
                        </td>

                        {/* Daily Consumption */}
                        <td className="py-3 px-2 text-neutral-300">
                          <span className="text-white font-semibold">{burnVal}</span>
                          <span className="text-[10px] text-neutral-400">/day</span>
                        </td>

                        {/* Days Cover */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold ${
                                daysVal <= 5
                                  ? "text-rose-400"
                                  : daysVal <= 14
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {daysVal.toFixed(1)}d
                            </span>
                          </div>
                          {inv.daysCoverPipeline > daysVal && (
                            <span className="text-[10px] text-neutral-400 block">
                              +pipe: {inv.daysCoverPipeline.toFixed(1)}d
                            </span>
                          )}
                        </td>

                        {/* Risk Status */}
                        <td className="py-3 px-2">
                          <StatusBadge status={inv.riskStatus} />
                        </td>

                        {/* Inbound Pipeline */}
                        <td className="py-3 px-2 text-neutral-300">
                          {inv.pipelineUnits > 0 ? (
                            <div>
                              <span className="text-white font-semibold">
                                +{inv.pipelineUnits}
                              </span>
                              <span className="text-[10px] text-neutral-400 ml-1">
                                (Day {inv.nextDeliveryDays ?? "?"})
                              </span>
                              <div className="text-[10px] text-neutral-400">
                                {inv.replenishmentStatus}
                              </div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">None</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalEditing(inv);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-[#161616] hover:bg-[#222222] border border-[#2b2b2b] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Medicine Telemetry"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Reorder Advisor & 10km Nearby Visibility */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          {selectedInventory && authorizedFacility ? (
            <div className="bg-[#080808] border border-[#222222] rounded-xl p-5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#1a1a1a] mb-4">
                <Package className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Reorder Advisor
                </h2>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                <span className="text-xs font-mono font-bold text-white truncate">
                  {selectedDrug?.name || selectedInventory.drugId}
                </span>
              </div>
              <ReorderAdvisorPanel
                facility={authorizedFacility}
                inventory={selectedInventory}
                drug={selectedDrug}
                facilities={facilities}
                inventories={inventories}
              />
              <p className="text-[10px] font-mono text-neutral-400 pt-3 mt-2 border-t border-[#1a1a1a]">
                Latest safe order date = day stock hits safety stock &minus; lead time
                &minus; 2-day buffer &bull; nearby = within {NEARBY_RADIUS_KM} km (haversine)
              </p>
            </div>
          ) : (
            <div className="bg-[#080808] border border-[#222222] rounded-xl p-10 flex flex-col items-center justify-center text-center">
              <Package className="w-10 h-10 text-neutral-600 mb-3" />
              <p className="text-sm font-mono text-neutral-400">
                No medicines to review yet
              </p>
              <p className="text-[11px] font-mono text-neutral-400 mt-1 mb-4">
                Add a medicine to see recommended order dates and nearby 10 km
                supply.
              </p>
              <button
                onClick={() => {
                  setModalEditing(null);
                  setModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-mono font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Medicine
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && authorizedFacility && (
        <MedicineFormModal
          key={modalEditing ? `edit-${modalEditing.id}` : "new"}
          onClose={() => {
            setModalOpen(false);
            setModalEditing(null);
          }}
          facilityId={authorizedFacility.id}
          facilityName={authorizedFacility.name}
          editing={modalEditing}
          drugs={drugs}
          existingDrugIdsAtFacility={existingDrugIds}
        />
      )}
    </main>
  );
}