"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/components/DashboardContext";
import { FacilityDetails } from "@/components/FacilityDetails";
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Users,
  Bed,
  Layers,
  Search,
  Activity,
} from "lucide-react";

export default function FacilitiesPage() {
  const {
    simulationResult,
    selectedDrug,
    currentSimDay,
    selectedFacilityId,
    setSelectedFacilityId,
    currentSelectedState,
    referralLinks,
  } = useDashboard();

  const facilityStates = simulationResult.facilityStateList;

  return (
    <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5 min-h-0">
      {/* Top Banner / Breadcrumb */}
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
              <Building2 className="w-5 h-5 text-amber-400" />
              <h1 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                Facility Operational Diagnostic Audit
              </h1>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Comprehensive clinical buffer telemetry, bed capacity, catchment load, and referral tier audit.
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

      {/* Main Grid: Facility Selector Column on the Left, Full Diagnostics on the Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Facility Directory & Selector (4 cols on lg, 3 cols on xl) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-[#080808] border border-[#222222] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1a1a1a]">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Facility Roster ({facilityStates.length})
            </span>
          </div>

          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {facilityStates.map((fs) => {
              const isSelected = fs.facility.id === selectedFacilityId;
              const riskColor =
                fs.dynamicRiskStatus === "critical"
                  ? "text-rose-400 border-rose-800/60 bg-rose-950/30"
                  : fs.dynamicRiskStatus === "warning"
                  ? "text-amber-400 border-amber-800/60 bg-amber-950/30"
                  : "text-emerald-400 border-emerald-800/60 bg-emerald-950/30";

              return (
                <button
                  key={fs.facility.id}
                  onClick={() => setSelectedFacilityId(fs.facility.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-[#181818] border-white/40 shadow-md ring-1 ring-white/20"
                      : "bg-[#0b0b0b] border-[#1f1f1f] hover:border-[#333333] hover:bg-[#121212]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-mono font-bold text-white leading-tight">
                      {fs.facility.name}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${riskColor}`}>
                      {fs.dynamicRiskStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-neutral-400">
                    <span>{fs.facility.facilityType}</span>
                    <span>&bull;</span>
                    <span>{fs.facility.tier} Tier</span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#181818] text-[10px] font-mono text-neutral-400">
                    <span>Days Cover: <strong className="text-white">{fs.effectiveDaysCover}d</strong></span>
                    <span>Stock: <strong className="text-white">{fs.currentStockAtDay}</strong></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Full Facility Diagnostic Details (8 cols on lg, 9 cols on xl) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
          {/* Facility Diagnostic Card Component */}
          <div className="bg-[#080808] border border-[#222222] rounded-xl p-5 shadow-lg">
            <FacilityDetails
              selectedState={currentSelectedState}
              selectedDrug={selectedDrug}
              simDay={currentSimDay}
            />
          </div>

          {/* Quick Context / Referral Connectivity */}
          <div className="bg-[#080808] border border-[#222222] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1c1c1c]">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Connected Referral Transfer Routes ({currentSelectedState?.facility.name})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              {referralLinks
                .filter(
                  (l) =>
                    l.sourceFacilityId === currentSelectedState?.facility.id ||
                    l.targetFacilityId === currentSelectedState?.facility.id
                )
                .map((link) => {
                  const isOutward = link.sourceFacilityId === currentSelectedState?.facility.id;
                  const peerFac = facilityStates.find(
                    (s) => s.facility.id === (isOutward ? link.targetFacilityId : link.sourceFacilityId)
                  )?.facility;

                  return (
                    <div
                      key={link.id}
                      className="p-3 rounded-lg bg-[#0e0e0e] border border-[#1f1f1f] flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] text-neutral-400 block">
                          {isOutward ? "Outgoing Escalation To:" : "Incoming Inflow From:"}
                        </span>
                        <span className="text-white font-bold">{peerFac?.name || "Peer Facility"}</span>
                        <span className="text-[10px] text-neutral-400 block">
                          {peerFac?.facilityType} &bull; {peerFac?.tier}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400">
                          {Math.round(link.transferVolumeShare * 100)}% volume
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          ~{link.transferTimeHours}h transit
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
