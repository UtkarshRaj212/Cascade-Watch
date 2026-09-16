"use client";

import React, { useState } from "react";
import { FacilitySimulationState } from "@/lib/simulation";
import { ShieldAlert, ChevronRight, Truck, Flame, AlertCircle } from "lucide-react";
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
      if (a.dynamicRiskStatus === "critical" && b.dynamicRiskStatus !== "critical") return -1;
      if (b.dynamicRiskStatus === "critical" && a.dynamicRiskStatus !== "critical") return 1;
      return b.dynamicRiskProbability - a.dynamicRiskProbability || a.effectiveDaysCover - b.effectiveDaysCover;
    });

  return (
    <div className="flex flex-col h-full bg-black border border-[#222222] rounded-xl overflow-hidden shadow-sm">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <div>
            <span className="font-semibold text-white text-sm uppercase tracking-wider font-mono block">
              Ranked Supply-Chain Risk Alerts
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Prioritized by stockout probability & depletion velocity &bull; {atRiskList.length} Active
            </span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-black border border-[#262626] rounded-lg p-1 text-xs font-mono">
          <button
            onClick={() => setFilterSeverity("all")}
            className={`px-3 py-1 rounded-md transition-all ${
              filterSeverity === "all" ? "bg-[#1f1f1f] text-white font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            All Alerts ({facilityStates.filter(s => s.dynamicRiskStatus === 'critical' || s.dynamicRiskStatus === 'warning').length})
          </button>
          <button
            onClick={() => setFilterSeverity("critical")}
            className={`px-3 py-1 rounded-md transition-all ${
              filterSeverity === "critical" ? "bg-rose-950 text-rose-300 font-bold border border-rose-800" : "text-neutral-400 hover:text-white"
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterSeverity("warning")}
            className={`px-3 py-1 rounded-md transition-all ${
              filterSeverity === "warning" ? "bg-amber-950 text-amber-300 font-bold border border-amber-800" : "text-neutral-400 hover:text-white"
            }`}
          >
            Warning
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1a1a1a] p-3 space-y-3">
        {atRiskList.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-xs font-mono">
            No at-risk facility alerts detected under active criteria.
          </div>
        ) : (
          atRiskList.map((state) => {
            const isSelected = selectedFacilityId === state.facility.id;
            const isCritical = state.dynamicRiskStatus === "critical";

            return (
              <div
                key={state.facility.id}
                onClick={() => onSelectFacility(state.facility.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer font-mono relative shadow-sm ${
                  isSelected
                    ? "bg-[#141414] border-white ring-1 ring-white/30"
                    : isCritical
                    ? "bg-[#0a0a0a] border-[#2e1518] hover:bg-[#111111] hover:border-rose-800"
                    : "bg-[#0a0a0a] border-[#291e13] hover:bg-[#111111] hover:border-amber-800"
                }`}
              >
                {/* Facility Name & Status Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-white text-sm block">
                      {state.facility.name}
                    </span>
                    <span className="text-xs text-neutral-400 mt-0.5 block">
                      {selectedDrug?.name || "Selected Formulation"} &bull; {state.facility.facilityType} ({state.facility.district})
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
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
                <div className="mt-3 grid grid-cols-2 gap-3 bg-black/70 p-3 rounded-lg border border-[#1e1e1e] text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[11px] uppercase font-semibold">Immediate Days Cover:</span>
                    <span
                      className={`text-sm font-bold ${
                        state.effectiveDaysCover <= 5
                          ? "text-rose-400"
                          : state.effectiveDaysCover <= 10
                          ? "text-amber-400"
                          : "text-neutral-200"
                      }`}
                    >
                      {state.isStockedOutNow ? "0.0 d (Stocked Out)" : `${state.effectiveDaysCover} days`}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[11px] uppercase font-semibold">Pipeline Buffer:</span>
                    <span className="text-neutral-300 text-sm font-medium">
                      {state.inventory.daysCoverPipeline.toFixed(1)} days ({state.inventory.pipelineUnits} {selectedDrug?.unit})
                    </span>
                  </div>
                </div>

                {/* Pipeline Status & Risk Driver */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Truck className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500 font-semibold">Replenishment Status:</span>
                    <span
                      className={`font-medium ${
                        state.inventory.replenishmentStatus.toLowerCase().includes("delay")
                          ? "text-rose-400"
                          : "text-neutral-300"
                      }`}
                    >
                      {state.inventory.replenishmentStatus}
                      {state.inventory.nextDeliveryDays ? ` (Scheduled ETA: Day ${state.inventory.nextDeliveryDays})` : ""}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-neutral-300">
                    <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-500 font-semibold">Risk Driver:</span>
                    <span className="text-neutral-300 leading-snug">{state.inventory.riskDriver}</span>
                  </div>
                </div>

                {/* Select Chevron indicator */}
                <div className="mt-3 pt-2 border-t border-[#1e1e1e] flex items-center justify-between text-xs text-neutral-400">
                  <span className="text-neutral-500 text-[11px]">Bed Capacity: {state.facility.bedCapacity} beds</span>
                  <span className="hover:underline flex items-center font-medium text-neutral-300">
                    {isSelected ? "Currently Audited in Inspector" : "Click to audit facility & trajectory"}
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
