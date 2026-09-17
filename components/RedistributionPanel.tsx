"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Truck,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Building2,
  Package,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Info,
} from "lucide-react";
import type {
  RedistributionPlan,
  ActionRecommendation,
  TransferRecommendation,
  EmergencyProcurementRecommendation,
  UrgencyTier,
} from "@/lib/redistribution";

interface RedistributionPanelProps {
  plan: RedistributionPlan;
  unit: string;
}

function urgencyConfig(urgency: UrgencyTier) {
  switch (urgency) {
    case "emergency":
      return {
        label: "EMERGENCY",
        color: "text-rose-400",
        bg: "bg-rose-950/50",
        border: "border-rose-700/60",
        ring: "ring-rose-500/20",
        dot: "bg-rose-500",
        icon: Zap,
      };
    case "urgent":
      return {
        label: "URGENT",
        color: "text-amber-400",
        bg: "bg-amber-950/40",
        border: "border-amber-700/50",
        ring: "ring-amber-500/20",
        dot: "bg-amber-500",
        icon: AlertTriangle,
      };
    case "moderate":
      return {
        label: "MODERATE",
        color: "text-sky-400",
        bg: "bg-sky-950/30",
        border: "border-sky-700/40",
        ring: "ring-sky-500/20",
        dot: "bg-sky-500",
        icon: Shield,
      };
    case "advisory":
      return {
        label: "ADVISORY",
        color: "text-neutral-400",
        bg: "bg-neutral-900/40",
        border: "border-neutral-700/40",
        ring: "ring-neutral-500/20",
        dot: "bg-neutral-500",
        icon: Info,
      };
  }
}

function TransferCard({
  action,
  unit,
  index,
}: {
  action: TransferRecommendation;
  unit: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = urgencyConfig(action.urgency);
  const UrgencyIcon = cfg.icon;

  return (
    <div
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 transition-all hover:shadow-lg`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/40 border border-[#2a2a2a] shrink-0 mt-0.5">
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cfg.border} ${cfg.color}`}
              >
                <UrgencyIcon className="w-3 h-3 inline mr-1" />
                {cfg.label}
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Action #{index + 1} • Transfer
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm font-mono">
              <span className="font-bold text-white truncate max-w-[180px]">
                {action.sourceFacility.name}
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-white truncate max-w-[180px]">
                {action.targetFacility.name}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xl font-bold font-mono text-white block">
            {action.quantity.toLocaleString()}
          </span>
          <span className="text-[11px] font-mono text-neutral-400">{unit}</span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="p-2 rounded-lg bg-black/30 border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Transit Time
          </span>
          <span className="text-xs font-bold font-mono text-white">
            {action.transitTimeHours}h
          </span>
        </div>
        <div className="p-2 rounded-lg bg-black/30 border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Impact
          </span>
          <span className="text-xs font-bold font-mono text-emerald-400">
            +{action.impactDaysCoverGained}d cover
          </span>
        </div>
        <div className="p-2 rounded-lg bg-black/30 border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Donor Retains
          </span>
          <span className="text-xs font-bold font-mono text-white">
            {action.sourceRemainingDaysCover}d cover
          </span>
        </div>
      </div>

      {/* Expandable Rationale */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 mt-3 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
      >
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
        <span>{expanded ? "Hide" : "View"} rationale</span>
      </button>
      {expanded && (
        <p className="mt-2 text-[11px] font-mono text-neutral-300 leading-relaxed p-3 rounded-lg bg-black/30 border border-[#1a1a1a]">
          {action.rationale}
        </p>
      )}
    </div>
  );
}

function ProcurementCard({
  action,
  unit,
  index,
}: {
  action: EmergencyProcurementRecommendation;
  unit: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = urgencyConfig(action.urgency);
  const UrgencyIcon = cfg.icon;

  return (
    <div
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 transition-all hover:shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/40 border border-[#2a2a2a] shrink-0 mt-0.5">
            <ShoppingCart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cfg.border} ${cfg.color}`}
              >
                <UrgencyIcon className="w-3 h-3 inline mr-1" />
                {cfg.label}
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Action #{index + 1} • Emergency Procurement
              </span>
            </div>
            <div className="mt-2 text-sm font-mono">
              <span className="font-bold text-white">
                {action.facility.name}
              </span>
              <span className="text-neutral-500 ml-2">
                {action.facility.facilityType}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xl font-bold font-mono text-rose-400 block">
            {action.quantityNeeded.toLocaleString()}
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {unit} needed
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="p-2 rounded-lg bg-black/30 border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Current Stock
          </span>
          <span className="text-xs font-bold font-mono text-white">
            {action.currentStock} {unit}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-black/30 border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Daily Burn
          </span>
          <span className="text-xs font-bold font-mono text-amber-400">
            {action.dailyConsumption} {unit}/day
          </span>
        </div>
        <div className="p-2 rounded-lg bg-black/30 border border-[#1a1a1a]">
          <span className="text-[10px] font-mono text-neutral-500 block">
            Stockout In
          </span>
          <span
            className={`text-xs font-bold font-mono ${action.daysUntilStockout !== null && action.daysUntilStockout <= 3 ? "text-rose-400" : "text-white"}`}
          >
            {action.daysUntilStockout !== null
              ? `${action.daysUntilStockout} days`
              : "N/A"}
          </span>
        </div>
      </div>

      {/* Expandable Rationale */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 mt-3 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
      >
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
        <span>{expanded ? "Hide" : "View"} rationale</span>
      </button>
      {expanded && (
        <p className="mt-2 text-[11px] font-mono text-neutral-300 leading-relaxed p-3 rounded-lg bg-black/30 border border-[#1a1a1a]">
          {action.rationale}
        </p>
      )}
    </div>
  );
}

export function RedistributionPanel({ plan, unit }: RedistributionPanelProps) {
  if (plan.actions.length === 0) {
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
    <div className="space-y-3">
      {plan.actions.map((action, idx) =>
        action.type === "transfer" ? (
          <TransferCard
            key={action.id}
            action={action as TransferRecommendation}
            unit={unit}
            index={idx}
          />
        ) : (
          <ProcurementCard
            key={action.id}
            action={action as EmergencyProcurementRecommendation}
            unit={unit}
            index={idx}
          />
        )
      )}
    </div>
  );
}
