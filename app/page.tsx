"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/components/DashboardContext";
import { FacilityRiskMap } from "@/components/FacilityRiskMap";
import { KpiSummary } from "@/components/KpiSummary";
import { Activity, ArrowRight, Waves, ShieldAlert, TrendingDown } from "lucide-react";

export default function HomePage() {
  const {
    simulationResult,
    referralLinks,
    selectedFacilityId,
    setSelectedFacilityId,
    focalFacilityId,
    currentSimDay,
    selectedDrug,
    horizonDays,
  } = useDashboard();

  return (
    <main className="flex-1 max-w-[1750px] w-full mx-auto px-3 sm:px-5 py-2 lg:py-2.5 flex flex-col lg:h-[calc(100vh-58px)] lg:max-h-[calc(100vh-58px)] lg:overflow-hidden min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-3.5 items-stretch flex-1 min-h-0">
        {/* Left Side: Healthcare Facility Risk & Referral Topology Map (7 cols on lg, 8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-[380px] lg:min-h-0">
          <FacilityRiskMap
            facilityStates={simulationResult.facilityStateList}
            referralLinks={referralLinks}
            selectedFacilityId={selectedFacilityId}
            onSelectFacility={(id) => setSelectedFacilityId(id)}
            cascadeActiveLinks={simulationResult.cascade.affectedReferralLinkIds}
            focalFacilityId={focalFacilityId}
            simDay={currentSimDay}
          />
        </div>

        {/* Right Side: Macro Overview / 5 Stats Boxes (5 cols on lg, 4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 justify-between gap-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#222222] shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-white text-xs uppercase tracking-wider font-mono">
                Macro Overview &bull; District Health KPIs
              </span>
            </div>
            <Link
              href="/cascade"
              className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Cascade Simulation</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Vertical Stack of 5 KPI Stats Boxes */}
          <div className="flex-1 min-h-0 flex flex-col justify-between">
            <KpiSummary
              criticalFacilities={simulationResult.kpis.criticalFacilities}
              facilitiesAtRisk={simulationResult.kpis.facilitiesAtRisk}
              expectedStockouts={simulationResult.kpis.expectedStockouts}
              unmetDemandUnits={simulationResult.kpis.unmetDemandUnits}
              averageDaysCover={simulationResult.kpis.averageDaysCover}
              unit={selectedDrug?.unit || "vials"}
              horizonDays={horizonDays}
              simDay={currentSimDay}
              isVertical={true}
            />
          </div>

          {/* Quick Action Navigation Strip */}
          <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-[#1c1c1c] shrink-0">
            <Link
              href="/cascade"
              className="py-1.5 px-2 rounded-lg bg-[#0a0a0a] hover:bg-[#141414] border border-[#222222] hover:border-[#383838] transition-all flex items-center justify-center gap-1.5 text-center group"
            >
              <Waves className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-[11px] font-mono font-medium text-neutral-300 group-hover:text-white truncate">
                Cascade Intel
              </span>
            </Link>

            <Link
              href="/trajectory"
              className="py-1.5 px-2 rounded-lg bg-[#0a0a0a] hover:bg-[#141414] border border-[#222222] hover:border-[#383838] transition-all flex items-center justify-center gap-1.5 text-center group"
            >
              <TrendingDown className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-[11px] font-mono font-medium text-neutral-300 group-hover:text-white truncate">
                Trajectory
              </span>
            </Link>

            <Link
              href="/alerts"
              className="py-1.5 px-2 rounded-lg bg-[#0a0a0a] hover:bg-[#141414] border border-[#222222] hover:border-[#383838] transition-all flex items-center justify-center gap-1.5 text-center group"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-[11px] font-mono font-medium text-neutral-300 group-hover:text-white truncate">
                Risk Alerts
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
