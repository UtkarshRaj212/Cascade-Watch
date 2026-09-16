"use client";

import React from "react";
import { CascadeDetails } from "@/lib/simulation";
import { Drug } from "@/lib/db/schema";
import { Waves, ArrowRight, AlertTriangle, ShieldAlert, Zap, Layers } from "lucide-react";

interface CascadeSummaryProps {
  cascade: CascadeDetails;
  selectedDrug: Drug | undefined;
  simDay: number;
  onSelectFacility: (facilityId: string) => void;
}

export function CascadeSummary({
  cascade,
  selectedDrug,
  simDay,
  onSelectFacility,
}: CascadeSummaryProps) {
  const {
    primaryFacility,
    primaryStockoutDay,
    secondaryFacilitiesAffected,
    divertedDemandRate,
    totalDivertedUnits,
    cascadeWaveReached,
    expectedAdditionalStockouts,
  } = cascade;

  const isCascadeTriggered = primaryStockoutDay !== null && simDay >= primaryStockoutDay;

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-rose-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider">
            Cascade Ripple & Referral Spillover Intelligence
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              isCascadeTriggered
                ? "bg-rose-950 text-rose-300 border-rose-700"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {isCascadeTriggered ? "CASCADE IN PROGRESS" : "CASCADE LATENT"}
          </span>
        </div>
      </div>

      {/* 5 Cascade Key Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 border-b border-slate-800/80 bg-slate-900/40">
        {/* 1. Primary Facility */}
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5">
          <span className="text-slate-400 text-[10px] uppercase block">Primary Epicenter</span>
          <span className="font-bold text-white text-xs block truncate mt-1">
            {primaryFacility?.name || "None Identified"}
          </span>
          <span className="text-[10px] text-rose-400 block mt-0.5">
            {primaryStockoutDay !== null ? `Stockout Day ${primaryStockoutDay}` : "Buffer Stable"}
          </span>
        </div>

        {/* 2. Secondary Facilities Affected */}
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5">
          <span className="text-slate-400 text-[10px] uppercase block">Secondary Facilities</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">
              {secondaryFacilitiesAffected.length}
            </span>
            <span className="text-[10px] text-slate-400">facilities</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-0.5">Direct referral recipients</span>
        </div>

        {/* 3. Diverted Demand */}
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5">
          <span className="text-slate-400 text-[10px] uppercase block">Diverted Demand Rate</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-orange-400">
              +{divertedDemandRate}
            </span>
            <span className="text-[10px] text-slate-400">{selectedDrug?.unit}/day</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-0.5">
            {totalDivertedUnits > 0 ? `${totalDivertedUnits} cumulative units redirected` : "Awaiting threshold"}
          </span>
        </div>

        {/* 4. Cascade Wave Reached */}
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5">
          <span className="text-slate-400 text-[10px] uppercase block">Cascade Wave Reached</span>
          <div className="flex items-center gap-1 mt-1">
            <Layers className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-bold text-slate-200 text-[11px] block truncate">
              {cascadeWaveReached.split(" - ")[0]}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 block truncate mt-0.5">
            {cascadeWaveReached.split(" - ")[1] || "Normal status"}
          </span>
        </div>

        {/* 5. Expected Additional Stockouts */}
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5 col-span-2 sm:col-span-1">
          <span className="text-slate-400 text-[10px] uppercase block">Additional Stockouts</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold font-mono ${expectedAdditionalStockouts > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {expectedAdditionalStockouts}
            </span>
            <span className="text-[10px] text-slate-400">secondary</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-0.5">
            Accelerated ripple stockouts
          </span>
        </div>
      </div>

      {/* Ripple Spillover Network Explanation & Secondary Facilities Cards */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="uppercase tracking-wider font-bold text-slate-300">
            Connected Referral Recipients Under Downstream Strain
          </span>
          <span className="text-slate-500">
            Patients redirected from {primaryFacility?.name || "Primary"}
          </span>
        </div>

        {secondaryFacilitiesAffected.length === 0 ? (
          <div className="p-4 text-center text-slate-500 bg-slate-900/40 rounded border border-slate-800/60">
            No secondary referral redirection links registered for this focal center.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {secondaryFacilitiesAffected.map((fac) => (
              <div
                key={fac.id}
                onClick={() => onSelectFacility(fac.id)}
                className="p-2.5 bg-slate-900 border border-slate-800 hover:border-sky-500 rounded cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-white text-[11px] group-hover:text-sky-300 flex items-center gap-1.5">
                    <span>{fac.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {fac.facilityType} &bull; {fac.district}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-amber-400 font-bold block">
                    Absorption Node
                  </span>
                  <span className="text-[9px] text-sky-400 flex items-center justify-end group-hover:underline">
                    Inspect <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-900/60 rounded p-2.5 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-200">Cascade Propagation Logic: </span>
          When <span className="text-rose-300 font-bold">{primaryFacility?.name || "the primary hub"}</span> stocks out,
          unmet emergency prescription volume deflects onto connected referral facilities. This accelerates inventory depletion
          across the secondary network and creates secondary stockouts unless preemptive inter-facility stock rebalancing or expedited procurement is triggered.
        </div>
      </div>
    </div>
  );
}
