"use client";

import React, { useState } from "react";
import {
  Truck,
  ShoppingCart,
  CheckCircle2,
  ArrowRightLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import type {
  RedistributionPlan,
  DemandHospitalGroup,
} from "@/lib/redistribution";

interface RedistributionPanelProps {
  plan: RedistributionPlan;
  unit: string;
}

function DemandHospitalCard({
  group,
  unit,
  index,
}: {
  group: DemandHospitalGroup;
  unit: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const isEmergency = group.urgency === "emergency";
  const isFullyCovered = group.isFullyCovered;

  return (
    <div className="rounded-xl border border-[#222222] bg-[#090909] hover:border-[#333333] p-4 sm:p-5 transition-all shadow-md font-mono space-y-4">
      {/* Header Row: Demand Hospital Info & Shortage Badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5 border ${
              isEmergency
                ? "bg-rose-950/40 border-rose-800/60 text-rose-400"
                : isFullyCovered
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"
                  : "bg-[#141414] border-[#2a2a2a] text-sky-400"
            }`}
          >
            {isEmergency ? (
              <Zap className="w-4 h-4" />
            ) : isFullyCovered ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Building2 className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isEmergency
                    ? "border-rose-700/60 bg-rose-950/50 text-rose-300"
                    : "border-[#2f2f2f] bg-[#141414] text-neutral-300"
                }`}
              >
                {group.urgency}
              </span>

              <span className="text-[10px] font-mono text-neutral-500">
                Demand Site #{index + 1}
              </span>

              {isFullyCovered ? (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Fully Covered via Lateral Transfers
                </span>
              ) : group.transfers.length > 0 ? (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-sky-800/60 bg-sky-950/40 text-sky-300 inline-flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> Partial Transfer + External Order
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-rose-800/60 bg-rose-950/40 text-rose-300 inline-flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> External Emergency Procurement
                </span>
              )}
            </div>

            <div className="mt-2 text-sm sm:text-base font-mono flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-white text-base">
                {group.facility.name}
              </span>
              <span className="text-xs text-neutral-400 font-sans">
                {group.facility.facilityType} • {group.facility.district}
              </span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0 sm:pl-3">
          <span className="text-2xl font-bold font-mono text-white block">
            {group.totalDeficitUnits.toLocaleString()}
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {unit} deficit / needed
          </span>
        </div>
      </div>

      {/* Demand Hospital Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-lg bg-[#050505] border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Current Stock
          </span>
          <span className="text-xs sm:text-sm font-bold font-mono text-white">
            {group.currentStock.toLocaleString()} {unit}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#050505] border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Daily Burn
          </span>
          <span className="text-xs sm:text-sm font-bold font-mono text-neutral-300">
            {group.dailyConsumption} {unit}/day
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#050505] border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Stockout In
          </span>
          <span
            className={`text-xs sm:text-sm font-bold font-mono ${
              group.daysUntilStockout !== null && group.daysUntilStockout <= 3
                ? "text-rose-400"
                : "text-white"
            }`}
          >
            {group.daysUntilStockout !== null
              ? `${group.daysUntilStockout} days`
              : "Stocked Out"}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#050505] border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Deficit Resolution
          </span>
          <span
            className={`text-xs sm:text-sm font-bold font-mono ${
              isFullyCovered
                ? "text-emerald-400"
                : group.totalCoveredUnits > 0
                  ? "text-sky-400"
                  : "text-rose-400"
            }`}
          >
            {isFullyCovered
              ? "100% Rebalanced"
              : group.totalCoveredUnits > 0
                ? `${group.totalCoveredUnits} transfer / ${group.unmetProcurementUnits} order`
                : "100% External Order"}
          </span>
        </div>
      </div>

      {/* Sending Hospital(s) Inbound Transfers (Displayed on the SAME card!) */}
      {group.transfers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#1a1a1a]">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              <Truck className="w-3.5 h-3.5" />
              <span>
                Inbound Stock Transfers ({group.transfers.length} sending{" "}
                {group.transfers.length === 1 ? "hospital" : "hospitals"})
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              Total incoming: <strong className="text-emerald-400 font-mono">+{group.totalCoveredUnits.toLocaleString()} {unit}</strong>
            </span>
          </div>

          <div className="space-y-2">
            {group.transfers.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg bg-[#050505] border border-[#1c1c1c] hover:border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white text-xs sm:text-sm font-mono">
                      {t.sourceFacility.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-sans">
                      ({t.sourceFacility.facilityType})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-[11px] font-mono text-neutral-400 flex-wrap">
                    <span>
                      Current Stock:{" "}
                      <strong className="text-white font-mono">
                        {t.sourceCurrentStock.toLocaleString()} {unit}
                      </strong>
                    </span>
                    <span className="text-neutral-600">•</span>
                    <span>
                      Donor retains:{" "}
                      <strong className="text-white font-mono">
                        {t.sourceRemainingDaysCover}d cover
                      </strong>
                    </span>
                    <span className="text-neutral-600">•</span>
                    <span>
                      Transit:{" "}
                      <strong className="text-sky-400 font-mono">
                        {t.transitTimeHours}h
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 sm:border-l sm:border-[#1a1a1a] sm:pl-4">
                  <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 block">
                    +{t.quantity.toLocaleString()} {unit}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    +{t.impactDaysCoverGained}d cover gained
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External Procurement (if unmet deficit remains, on the SAME card!) */}
      {group.procurement && (
        <div className="pt-2 border-t border-[#1a1a1a]">
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShoppingCart className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-xs font-bold font-mono text-rose-300 block">
                  External Emergency Procurement
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {group.transfers.length > 0
                    ? "Remaining deficit exceeds lateral transfer surplus — external requisition required"
                    : "Network surplus insufficient across referral chain — expedited purchase required"}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-sm sm:text-base font-bold font-mono text-rose-400 block">
                {group.unmetProcurementUnits.toLocaleString()} {unit}
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                external order
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Unified Combined Rationale (includes both demand & donor details) */}
      <div className="pt-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          <span>{expanded ? "Hide" : "View"} unified allocation rationale</span>
        </button>
        {expanded && (
          <div className="mt-2 text-[11px] sm:text-xs font-mono text-neutral-300 leading-relaxed p-3.5 rounded-lg bg-[#050505] border border-[#1a1a1a]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Operational Allocation Rationale:
            </span>
            <p>{group.combinedRationale}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function RedistributionPanel({ plan, unit }: RedistributionPanelProps) {
  if (plan.hospitalGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
        <h3 className="text-lg font-bold font-mono text-white mb-2">
          No Redistribution Actions Required
        </h3>
        <p className="text-sm font-mono text-neutral-400 max-w-md">
          All monitored facilities have adequate stock levels and safety buffers.
          No transfers or emergency procurements are recommended at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plan.hospitalGroups.map((group, idx) => (
        <DemandHospitalCard
          key={group.id}
          group={group}
          unit={unit}
          index={idx}
        />
      ))}
    </div>
  );
}
