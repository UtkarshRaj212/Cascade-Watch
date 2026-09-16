"use client";

import React from "react";
import { FacilitySimulationState } from "@/lib/simulation";
import { Drug } from "@/lib/db/schema";
import { Building2, Pill, Flame, AlertTriangle, CheckCircle, HelpCircle, XCircle, Truck, Users, Bed } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface FacilityDetailsProps {
  selectedState: FacilitySimulationState | null;
  selectedDrug: Drug | undefined;
  simDay: number;
}

export function FacilityDetails({ selectedState, selectedDrug, simDay }: FacilityDetailsProps) {
  if (!selectedState) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-black border border-[#222222] rounded-xl h-full text-neutral-500 font-mono text-xs shadow-sm">
        <Building2 className="w-10 h-10 mb-3 text-neutral-600" />
        <span className="text-sm">Select a facility from the map or alert feed to audit operational telemetry</span>
      </div>
    );
  }

  const { facility, inventory, currentStockAtDay, effectiveDaysCover, dynamicRiskStatus, dynamicRiskProbability, divertedDemandReceived } = selectedState;

  const statusTheme = {
    critical: {
      border: "border-rose-900/70",
      bg: "bg-[#140608]",
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      title: "text-rose-400",
      icon: XCircle,
      label: "CRITICAL RISK",
    },
    warning: {
      border: "border-amber-900/70",
      bg: "bg-[#140d04]",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      title: "text-amber-400",
      icon: AlertTriangle,
      label: "WARNING ELEVATED",
    },
    low: {
      border: "border-emerald-900/70",
      bg: "bg-[#05140b]",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      title: "text-emerald-400",
      icon: CheckCircle,
      label: "HEALTHY BUFFER",
    },
    insufficient_data: {
      border: "border-[#222222]",
      bg: "bg-[#0a0a0a]",
      badge: "bg-[#181818] text-neutral-300 border-[#333333]",
      title: "text-neutral-400",
      icon: HelpCircle,
      label: "NO TELEMETRY",
    },
  }[dynamicRiskStatus];

  const StatusIcon = statusTheme.icon;

  return (
    <div className={`flex flex-col bg-black border ${statusTheme.border} rounded-xl overflow-hidden font-mono shadow-sm`}>
      {/* Top Header Card */}
      <div className={`p-5 ${statusTheme.bg} border-b ${statusTheme.border} flex flex-wrap items-start justify-between gap-3`}>
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-white text-base tracking-tight">{facility.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-black/60 border border-[#333333] text-neutral-300 font-medium">
              {facility.code}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-neutral-400">
            <span>{facility.facilityType}</span>
            <span>&bull;</span>
            <span>{facility.tier} Tier</span>
            <span>&bull;</span>
            <span>{facility.district} District</span>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="flex flex-col items-end shrink-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold border ${statusTheme.badge}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{statusTheme.label}</span>
          </div>
          <span className="text-xs text-neutral-400 mt-1.5">
            Simulation Day T+{simDay}
          </span>
        </div>
      </div>

      {/* Facility Context & Metric Grid */}
      <div className="p-5 space-y-4">
        {/* Drug Context Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Pill className="w-5 h-5 text-neutral-300" />
            <div>
              <span className="text-[11px] text-neutral-500 uppercase tracking-wider block font-semibold">Target Medicine Formulation:</span>
              <span className="font-bold text-white text-sm">{selectedDrug?.name || "Selected Formulation"}</span>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-neutral-500">Therapeutic Class: </span>
            <span className="text-neutral-200 font-medium">{selectedDrug?.category || "Essential"}</span>
          </div>
        </div>

        {/* 2x2 Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Current Inventory */}
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-neutral-400 text-xs uppercase block font-semibold">Current Stock</span>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl font-bold text-white">{formatNumber(currentStockAtDay)}</span>
              <span className="text-xs text-neutral-400">{selectedDrug?.unit}</span>
            </div>
            <span className="text-[11px] text-neutral-500 block">
              Baseline: {inventory.currentStock} {selectedDrug?.unit}
            </span>
          </div>

          {/* Average Daily Consumption */}
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-neutral-400 text-xs uppercase block font-semibold">Daily Consumption</span>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl font-bold text-white">
                {(inventory.avgDailyConsumption + divertedDemandReceived).toFixed(0)}
              </span>
              <span className="text-xs text-neutral-400">{selectedDrug?.unit}/d</span>
            </div>
            {divertedDemandReceived > 0 ? (
              <span className="text-[11px] text-rose-400 font-semibold block">
                +{divertedDemandReceived} diverted from cascade!
              </span>
            ) : (
              <span className="text-[11px] text-neutral-500 block">Baseline demand velocity</span>
            )}
          </div>

          {/* Days Cover */}
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-neutral-400 text-xs uppercase block font-semibold">Days Cover</span>
            <div className="flex items-baseline gap-1.5 my-2">
              <span
                className={`text-2xl font-bold ${
                  effectiveDaysCover <= 5
                    ? "text-rose-400"
                    : effectiveDaysCover <= 10
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {selectedState.isStockedOutNow ? "0.0" : effectiveDaysCover}
              </span>
              <span className="text-xs text-neutral-400">days</span>
            </div>
            <span className="text-[11px] text-neutral-500 block">
              Safe buffer: {selectedDrug?.safetyStockDays || 10}d
            </span>
          </div>

          {/* Stockout Probability */}
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-neutral-400 text-xs uppercase block font-semibold">Stockout Risk</span>
            <div className="flex items-baseline gap-1.5 my-2">
              <span
                className={`text-2xl font-bold ${
                  dynamicRiskProbability >= 0.7
                    ? "text-rose-400"
                    : dynamicRiskProbability >= 0.4
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {Math.round(dynamicRiskProbability * 100)}%
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 block">
              Buffer & pipeline model
            </span>
          </div>
        </div>

        {/* Replenishment Pipeline Details */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-neutral-400" />
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider block font-semibold">Replenishment Status:</span>
              <span
                className={`text-sm font-bold ${
                  inventory.replenishmentStatus.toLowerCase().includes("delay")
                    ? "text-rose-400"
                    : "text-neutral-200"
                }`}
              >
                {inventory.replenishmentStatus}
              </span>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-neutral-500 block">Pipeline Inbound Dispatch:</span>
            <span className="font-bold text-white text-sm">
              {inventory.pipelineUnits} {selectedDrug?.unit}
              {inventory.nextDeliveryDays !== null ? ` &bull; Expected Day ${inventory.nextDeliveryDays}` : ""}
            </span>
          </div>
        </div>

        {/* Risk Drivers Diagnostic Box */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Flame className="w-4 h-4" />
            <span>Root Operational Diagnostic</span>
          </div>
          <p className="text-neutral-300 text-xs lg:text-sm leading-relaxed font-sans">{inventory.riskDriver}</p>
          <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-neutral-500" />
              Bed Capacity: {facility.bedCapacity} operational beds
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-neutral-500" />
              Catchment Population: {formatNumber(facility.catchmentPopulation)} citizens
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
