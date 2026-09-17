"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useDashboard } from "@/components/DashboardContext";
import { ReorderAdvisorPanel } from "@/components/ReorderAdvisorPanel";
import { MedicineFormModal } from "@/components/MedicineFormModal";
import { NEARBY_RADIUS_KM } from "@/lib/stockInsights";
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
  const {
    facilities,
    drugs,
    inventories,
    selectedFacilityId,
    setSelectedFacilityId,
  } = useDashboard();

  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditing, setModalEditing] = useState<import("@/lib/db/schema").FacilityInventory | null>(
    null
  );

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);
  const facilityInventories = useMemo(
    () =>
      inventories
        .filter((i) => i.facilityId === selectedFacilityId)
        .sort((a, b) => {
          const riskOrder = { critical: 0, warning: 1, low: 2 };
          const ra = riskOrder[a.riskStatus as keyof typeof riskOrder] ?? 3;
          const rb = riskOrder[b.riskStatus as keyof typeof riskOrder] ?? 3;
          return ra - rb;
        }),
    [inventories, selectedFacilityId]
  );

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
                Medicine & Stock Advisor
              </h1>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Per-hospital medicine stats, add/edit stock, reorder date &amp; nearby-10km
              inventory visibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222222] hover:border-[#383838] transition-colors"
          >
            <span>Network Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Facility Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#080808] border border-[#222222]">
        <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
        <label
          htmlFor="inv-facility-select"
          className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold shrink-0"
        >
          Hospital:
        </label>
        <select
          id="inv-facility-select"
          aria-label="Select hospital"
          value={selectedFacilityId || facilities[0]?.id}
          onChange={(e) => {
            setSelectedFacilityId(e.target.value);
            setSelectedInvId(null);
          }}
          className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#2a2a2a] text-white font-mono text-xs focus:outline-none focus:border-[#555555] transition-all cursor-pointer"
        >
          {facilities.map((f) => (
            <option key={f.id} value={f.id} className="bg-[#0e0e0e]">
              {f.name} — {f.district} ({f.facilityType})
            </option>
          ))}
        </select>
        {selectedFacility && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {facilityCriticalCount > 0 && (
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded">
                {facilityCriticalCount} critical
              </span>
            )}
            {facilityWarningCount > 0 && (
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded">
                {facilityWarningCount} warning
              </span>
            )}
          </div>
        )}
      </div>

      {/* Two-column layout: Stats Table (left) | Advisor (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Medicine Stats Table */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#080808] border border-[#222222] rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                {selectedFacility?.name || "Facility"} — Medicines ({facilityInventories.length})
              </span>
            </div>
            <button
              onClick={() => {
                setModalEditing(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-mono font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Medicine</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#0c0c0c] border-b border-[#1a1a1a]">
                  <th className="text-left px-4 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Medicine
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider hidden sm:table-cell">
                    /day
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider hidden md:table-cell">
                    Days
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider hidden lg:table-cell">
                    Pipeline
                  </th>
                  <th className="text-center px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                {facilityInventories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <Package className="w-8 h-8 text-neutral-600" />
                        <p className="text-neutral-500 font-mono text-xs">
                          No medicines tracked at this facility yet.
                        </p>
                        <button
                          onClick={() => {
                            setModalEditing(null);
                            setModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-mono font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Medicine
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  facilityInventories.map((inv) => {
                    const drug = drugs.find((d) => d.id === inv.drugId);
                    const isSelected =
                      selectedInvId !== null
                        ? inv.id === selectedInvId
                        : inv.id === facilityInventories[0]?.id;
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvId(inv.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#161616]"
                            : "hover:bg-[#0c0c0c]"
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-white font-semibold truncate max-w-[200px]">
                              {drug?.name || inv.drugId}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {drug?.category || "Essential"} · {drug?.unit || "units"}
                            </span>
                          </div>
                        </td>
                        <td className="text-right px-3 py-2.5">
                          <span
                            className={`font-bold ${
                              inv.daysCover <= 5.5
                                ? "text-rose-400"
                                : inv.daysCover <= 14
                                ? "text-amber-400"
                                : "text-white"
                            }`}
                          >
                            {inv.currentStock}
                          </span>
                        </td>
                        <td className="text-right px-3 py-2.5 hidden sm:table-cell text-neutral-300">
                          {inv.avgDailyConsumption}
                        </td>
                        <td className="text-right px-3 py-2.5 hidden md:table-cell">
                          <span
                            className={`font-bold ${
                              inv.daysCover <= 5.5
                                ? "text-rose-400"
                                : inv.daysCover <= 14
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {inv.daysCover}d
                          </span>
                        </td>
                        <td className="text-right px-3 py-2.5 hidden lg:table-cell text-neutral-300">
                          {inv.pipelineUnits}
                          {inv.nextDeliveryDays !== null && (
                            <span className="text-[10px] text-neutral-500 ml-1">
                              in {inv.nextDeliveryDays}d
                            </span>
                          )}
                        </td>
                        <td className="text-center px-3 py-2.5">
                          <StatusBadge status={inv.riskStatus} />
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalEditing(inv);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-neutral-500 hover:text-white transition-colors"
                            title="Edit"
                            aria-label={`Edit ${drug?.name || inv.drugId}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Facility Context Strip */}
          {selectedFacility && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0c0c0c] border-t border-[#1a1a1a] text-[10px] font-mono text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-neutral-500" />
                {selectedFacility.facilityType} · {selectedFacility.tier} ·{" "}
                {selectedFacility.district}
              </span>
              <span>{selectedFacility.catchmentPopulation.toLocaleString()} catchment</span>
            </div>
          )}
        </div>

        {/* Right: Reorder Advisor */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          {selectedInventory && selectedFacility ? (
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
                facility={selectedFacility}
                inventory={selectedInventory}
                drug={selectedDrug}
                facilities={facilities}
                inventories={inventories}
              />
              <p className="text-[10px] font-mono text-neutral-500 pt-3 mt-2 border-t border-[#1a1a1a]">
                Latest safe order date = day stock hits safety stock − lead time
                − 2-day buffer · nearby = within {NEARBY_RADIUS_KM} km (haversine)
              </p>
            </div>
          ) : (
            <div className="bg-[#080808] border border-[#222222] rounded-xl p-10 flex flex-col items-center justify-center text-center">
              <Package className="w-10 h-10 text-neutral-600 mb-3" />
              <p className="text-sm font-mono text-neutral-400">
                No medicines to review yet
              </p>
              <p className="text-[11px] font-mono text-neutral-600 mt-1 mb-4">
                Add a medicine to see recommended order dates and nearby 10 km
                supply.
              </p>
              <button
                onClick={() => {
                  setModalEditing(null);
                  setModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-mono font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Medicine
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && selectedFacility && (
        <MedicineFormModal
          key={modalEditing ? `edit-${modalEditing.id}` : "new"}
          onClose={() => {
            setModalOpen(false);
            setModalEditing(null);
          }}
          facilityId={selectedFacility.id}
          facilityName={selectedFacility.name}
          editing={modalEditing}
          drugs={drugs}
          existingDrugIdsAtFacility={existingDrugIds}
        />
      )}
    </main>
  );
}