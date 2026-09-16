"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/components/DashboardContext";
import { StockTrajectoryChart } from "@/components/StockTrajectoryChart";
import {
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  Building2,
  Package,
  Clock,
  Truck,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function TrajectoryPage() {
  const {
    simulationResult,
    selectedDrug,
    horizonDays,
    currentSimDay,
    setCurrentSimDay,
    selectedFacilityId,
    setSelectedFacilityId,
    currentSelectedState,
  } = useDashboard();

  const facilityStates = simulationResult.facilityStateList;

  return (
    <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5 min-h-0">
      {/* Top Banner / Breadcrumb & Facility Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#222222]">
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
              <TrendingDown className="w-5 h-5 text-sky-400" />
              <h1 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                Inventory Depletion Trajectory &amp; Stockout Horizon
              </h1>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Deterministic forward-projection of hospital drug inventory, replenishment pipeline, and stockout dates.
            </p>
          </div>
        </div>

        {/* Facility Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0e0e0e] border border-[#262626] rounded-lg px-3 py-1.5">
            <Building2 className="w-4 h-4 text-neutral-400" />
            <label htmlFor="traj-facility-select" className="text-xs font-mono text-neutral-400">
              Facility:
            </label>
            <select
              id="traj-facility-select"
              value={selectedFacilityId || ""}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="bg-transparent text-white font-mono font-semibold text-xs focus:outline-none cursor-pointer max-w-[220px]"
            >
              {facilityStates.map((fs) => (
                <option key={fs.facility.id} value={fs.facility.id} className="bg-[#111111] text-white">
                  {fs.facility.name} ({fs.dynamicRiskStatus.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/alerts"
            className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222222] hover:border-[#383838] transition-colors"
          >
            <span>View Risk Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-[#080808] border border-[#222222] rounded-xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2 font-mono text-xs text-neutral-300">
            <span className="font-bold text-white text-sm">{currentSelectedState?.facility.name}</span>
            <span className="text-neutral-500">&bull;</span>
            <span className="text-neutral-400">{currentSelectedState?.facility.facilityType}</span>
            <span className="text-neutral-500">&bull;</span>
            <span className="text-sky-400 font-semibold">{selectedDrug?.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-neutral-400">
              Current Stock at T+{currentSimDay}: <span className="text-white font-bold">{currentSelectedState?.currentStockAtDay} {selectedDrug?.unit}</span>
            </span>
          </div>
        </div>

        {/* Stock Trajectory Chart */}
        <div className="w-full">
          <StockTrajectoryChart
            selectedState={currentSelectedState}
            selectedDrug={selectedDrug}
            horizonDays={horizonDays}
            simDay={currentSimDay}
            onSelectSimDay={setCurrentSimDay}
          />
        </div>
      </div>

      {/* Trajectory Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Stock & Days Cover */}
        <div className="p-4 rounded-xl bg-[#080808] border border-[#222222] space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Stock Coverage</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {currentSelectedState?.effectiveDaysCover}
            </span>
            <span className="text-xs font-mono text-neutral-400">Days of Cover</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">
            Based on current daily consumption of {currentSelectedState?.inventory.avgDailyConsumption} {selectedDrug?.unit}/day.
          </p>
        </div>

        {/* Metric 2: Stockout Day */}
        <div className="p-4 rounded-xl bg-[#080808] border border-[#222222] space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Projected Stockout</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${currentSelectedState?.stockoutDay ? "text-rose-400" : "text-emerald-400"}`}>
              {currentSelectedState?.stockoutDay ? `Day T+${currentSelectedState.stockoutDay}` : "No Stockout"}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">
            {currentSelectedState?.stockoutDay
              ? `Expected depletion in ${Math.max(0, currentSelectedState.stockoutDay - currentSimDay)} days.`
              : `Stock remains sufficient through the ${horizonDays}-day horizon.`}
          </p>
        </div>

        {/* Metric 3: Pipeline Replenishment */}
        <div className="p-4 rounded-xl bg-[#080808] border border-[#222222] space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Pipeline Arrival</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {currentSelectedState?.inventory.pipelineUnits || 0}
            </span>
            <span className="text-xs font-mono text-neutral-400">{selectedDrug?.unit}</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">
            {currentSelectedState?.inventory.nextDeliveryDays
              ? `Arrival scheduled in Day T+${currentSelectedState.inventory.nextDeliveryDays} (${currentSelectedState.inventory.replenishmentStatus})`
              : "No upcoming shipments scheduled."}
          </p>
        </div>

        {/* Metric 4: Safety Stock Threshold */}
        <div className="p-4 rounded-xl bg-[#080808] border border-[#222222] space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Safety Stock Buffer</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-300">
              {currentSelectedState?.inventory.safetyStock || 0}
            </span>
            <span className="text-xs font-mono text-neutral-400">{selectedDrug?.unit}</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">
            Buffer required to protect against unexpected surges and vendor delays.
          </p>
        </div>
      </div>
    </main>
  );
}
