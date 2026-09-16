"use client";

import React from "react";
import { CascadeDetails } from "@/lib/simulation";
import { Drug } from "@/lib/db/schema";
import { Waves, ArrowRight, Layers, ShieldAlert, AlertTriangle } from "lucide-react";

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
    <div className="flex flex-col bg-black border border-[#222222] rounded-xl overflow-hidden font-mono shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <Waves className="w-5 h-5 text-neutral-300" />
          <div>
            <span className="font-semibold text-white text-sm uppercase tracking-wider block">
              Cascade Ripple & Referral Spillover Analysis
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Inter-facility patient deflection & downstream depletion metrics
            </span>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
              isCascadeTriggered
                ? "bg-rose-950/70 text-rose-300 border-rose-700/80 shadow-sm"
                : "bg-[#141414] text-neutral-400 border-[#2b2b2b]"
            }`}
          >
            {isCascadeTriggered ? "CASCADE IN ACTIVE DEFLECTION" : "CASCADE LATENT / PRE-DEFLECTION"}
          </span>
        </div>
      </div>

      {/* 5 Cascade Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 p-5 border-b border-[#1f1f1f] bg-[#050505]">
        {/* 1. Primary Facility */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Primary Epicenter</span>
          <div className="my-2">
            <span className="font-bold text-white text-sm block truncate">
              {primaryFacility?.name || "None Identified"}
            </span>
            <span className="text-xs text-neutral-400 block mt-0.5">
              {primaryFacility ? `${primaryFacility.tier} &bull; ${primaryFacility.district}` : "No hub selected"}
            </span>
          </div>
          <span className="text-xs text-rose-400 font-medium block">
            {primaryStockoutDay !== null ? `Stockout Day T+${primaryStockoutDay}` : "Buffer Stable"}
          </span>
        </div>

        {/* 2. Secondary Facilities Affected */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Secondary Facilities</span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-amber-400">
              {secondaryFacilitiesAffected.length}
            </span>
            <span className="text-xs text-neutral-400">centers</span>
          </div>
          <span className="text-xs text-neutral-500 block">Direct referral recipients</span>
        </div>

        {/* 3. Diverted Demand */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Diverted Demand Rate</span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-orange-400">
              +{divertedDemandRate}
            </span>
            <span className="text-xs text-neutral-400">{selectedDrug?.unit}/day</span>
          </div>
          <span className="text-xs text-neutral-500 block">
            {totalDivertedUnits > 0 ? `${totalDivertedUnits} cumulative units redirected` : "Awaiting stockout threshold"}
          </span>
        </div>

        {/* 4. Cascade Wave Reached */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Cascade Wave Reached</span>
          <div className="my-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-300 shrink-0" />
            <span className="font-bold text-white text-sm block truncate">
              {cascadeWaveReached.split(" - ")[0]}
            </span>
          </div>
          <span className="text-xs text-neutral-400 block truncate">
            {cascadeWaveReached.split(" - ")[1] || "Baseline"}
          </span>
        </div>

        {/* 5. Expected Additional Stockouts */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Additional Stockouts</span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className={`text-2xl lg:text-3xl font-bold font-mono ${expectedAdditionalStockouts > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {expectedAdditionalStockouts}
            </span>
            <span className="text-xs text-neutral-400">secondary sites</span>
          </div>
          <span className="text-xs text-neutral-500 block">
            Accelerated ripple depletion
          </span>
        </div>
      </div>

      {/* Connected Absorption Nodes & Propagation Logic */}
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
          <span className="uppercase tracking-wider font-bold text-neutral-200">
            Connected Referral Recipients Absorbing Deflected Patients
          </span>
          <span className="text-neutral-500 font-mono">
            Directly coupled to {primaryFacility?.name || "the focal epicenter"}
          </span>
        </div>

        {secondaryFacilitiesAffected.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] text-xs">
            No secondary referral redirection links registered for this focal center.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {secondaryFacilitiesAffected.map((fac) => (
              <div
                key={fac.id}
                onClick={() => onSelectFacility(fac.id)}
                className="p-4 bg-[#0a0a0a] border border-[#1f1f1f] hover:border-neutral-400 rounded-lg cursor-pointer transition-all flex items-center justify-between group shadow-sm"
              >
                <div>
                  <div className="font-bold text-white text-xs group-hover:text-neutral-200 flex items-center gap-2">
                    <span>{fac.name}</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {fac.facilityType} &bull; {fac.district}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-amber-400 font-bold block">
                    Absorption Node
                  </span>
                  <span className="text-xs text-neutral-400 flex items-center justify-end group-hover:text-white mt-0.5">
                    Inspect <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#1f1f1f] text-xs text-neutral-300 leading-relaxed font-sans">
          <span className="font-bold text-white font-mono uppercase tracking-wider text-xs block mb-1">
            Deterministic Ripple Mechanics:
          </span>
          When <span className="text-rose-400 font-semibold">{primaryFacility?.name || "the primary hub"}</span> depletes its inventory,
          unmet emergency prescription volume deflects onto connected referral facilities. This accelerates inventory depletion
          across the secondary network and precipitates secondary stockouts unless preemptive inter-facility stock rebalancing or emergency procurement dispatch is initiated.
        </div>
      </div>
    </div>
  );
}
