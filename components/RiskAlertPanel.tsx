"use client";

import React, { useState } from "react";
import { FacilitySimulationState } from "@/lib/simulation";
import { AlertCircle, AlertTriangle, ChevronRight, ShieldAlert, Truck, Flame } from "lucide-react";
import { Drug } from "@/lib/db/schema";

interface RiskAlertPanelProps {
  facilityStates: FacilitySimulationState[];
  selectedDrug: Drug | undefined;
  selectedFacilityId: string | null;
  onSelectFacility: (facilityId: string) => void;
}

export function RiskAlertPanel({
  facilityStates,
  selectedDrug,
  selectedFacilityId,
  onSelectFacility,
}: RiskAlertPanelProps) {
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning">("all");

  // Filter at-risk facilities (critical or warning)
  const atRiskList = facilityStates
    .filter((s) => {
      if (s.dynamicRiskStatus === "insufficient_data" || s.dynamicRiskStatus === "low") {
        return false;
      }
      if (filterSeverity === "critical") return s.dynamicRiskStatus === "critical";
      if (filterSeverity === "warning") return s.dynamicRiskStatus === "warning";
      return true;
    })
    .sort((a, b) => {
      // Sort critical before warning, then by risk probability desc, then by daysCover asc
      if (a.dynamicRiskStatus === "critical" && b.dynamicRiskStatus !== "critical") return -1;
      if (b.dynamicRiskStatus === "critical" && a.dynamicRiskStatus !== "critical") return 1;
      return b.dynamicRiskProbability - a.dynamicRiskProbability || a.effectiveDaysCover - b.effectiveDaysCover;
    });

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/90 text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Ranked Risk Alerts
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-mono font-bold">
            {atRiskList.length} Active
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded p-0.5 text-[11px] font-mono">
          <button
            onClick={() => setFilterSeverity("all")}
            className={`px-2 py-0.5 rounded ${
              filterSeverity === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterSeverity("critical")}
            className={`px-2 py-0.5 rounded ${
              filterSeverity === "critical" ? "bg-rose-950 text-rose-300 font-bold border border-rose-800" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterSeverity("warning")}
            className={`px-2 py-0.5 rounded ${
              filterSeverity === "warning" ? "bg-amber-950 text-amber-300 font-bold border border-amber-800" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Warning
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70 p-2 space-y-2">
        {atRiskList.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs font-mono">
            No at-risk facility alerts under current filter criteria.
          </div>
        ) : (
          atRiskList.map((state) => {
            const isSelected = selectedFacilityId === state.facility.id;
            const isCritical = state.dynamicRiskStatus === "critical";

            return (
              <div
                key={state.facility.id}
                onClick={() => onSelectFacility(state.facility.id)}
                className={`p-3 rounded border transition-all cursor-pointer text-xs font-mono relative ${
                  isSelected
                    ? "bg-slate-900 border-sky-500 shadow-md ring-1 ring-sky-500/40"
                    : isCritical
                    ? "bg-slate-900/60 border-rose-900/50 hover:bg-slate-900 hover:border-rose-700/80"
                    : "bg-slate-900/40 border-amber-900/40 hover:bg-slate-900 hover:border-amber-700/80"
                }`}
              >
                {/* Facility Name & Status Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-100 text-[13px] block">
                      {state.facility.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selectedDrug?.name || "Selected Drug"} &bull; {state.facility.facilityType}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                        isCritical
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {Math.round(state.dynamicRiskProbability * 100)}% stockout risk
                    </span>
                  </div>
                </div>

                {/* Cover Metrics Row */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded border border-slate-800/60 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Days Cover:</span>
                    <span
                      className={`font-bold ${
                        state.effectiveDaysCover <= 5
                          ? "text-rose-400"
                          : state.effectiveDaysCover <= 10
                          ? "text-amber-400"
                          : "text-slate-200"
                      }`}
                    >
                      {state.isStockedOutNow ? "0.0 d (Stocked Out)" : `${state.effectiveDaysCover} days`}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Pipeline Cover:</span>
                    <span className="text-slate-300 font-medium">
                      {state.inventory.daysCoverPipeline.toFixed(1)} days ({state.inventory.pipelineUnits} {selectedDrug?.unit})
                    </span>
                  </div>
                </div>

                {/* Pipeline Status & Risk Driver */}
                <div className="mt-2 space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">Pipeline:</span>
                    <span
                      className={`font-medium ${
                        state.inventory.replenishmentStatus.toLowerCase().includes("delay")
                          ? "text-rose-400"
                          : "text-slate-300"
                      }`}
                    >
                      {state.inventory.replenishmentStatus}
                      {state.inventory.nextDeliveryDays ? ` (ETA: Day ${state.inventory.nextDeliveryDays})` : ""}
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 text-slate-300">
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-slate-500">Driver:</span>
                    <span className="text-slate-300 leading-snug">{state.inventory.riskDriver}</span>
                  </div>
                </div>

                {/* Select Chevron indicator */}
                <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-end text-[10px] text-sky-400 font-sans">
                  <span className="hover:underline flex items-center">
                    {isSelected ? "Active in Inspector" : "Click to inspect details & trajectory"}
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
