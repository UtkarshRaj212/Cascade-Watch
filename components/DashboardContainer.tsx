"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Facility, Drug, FacilityInventory, ReferralLink } from "@/lib/db/schema";
import { runCascadeSimulation, SimulationResult } from "@/lib/simulation";
import { DashboardHeader } from "./DashboardHeader";
import { DeepDivePanel } from "./DeepDivePanel";
import { KpiSummary } from "./KpiSummary";
import { FacilityRiskMap } from "./FacilityRiskMap";
import { Network, Activity, ArrowRight, Layers } from "lucide-react";

interface DashboardContainerProps {
  initialData: {
    facilities: Facility[];
    drugs: Drug[];
    inventories: FacilityInventory[];
    referralLinks: ReferralLink[];
  };
}

export function DashboardContainer({ initialData }: DashboardContainerProps) {
  const { facilities, drugs, inventories, referralLinks } = initialData;

  const districts = useMemo(() => {
    return Array.from(new Set(facilities.map((f) => f.district))).sort();
  }, [facilities]);

  const [selectedDistrict, setSelectedDistrict] = useState<string>("Pune");
  const [selectedDrugId, setSelectedDrugId] = useState<string>(
    drugs.find((d) => d.id === "drug-ceftriaxone")?.id || drugs[0]?.id || ""
  );
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [currentSimDay, setCurrentSimDay] = useState<number>(0);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>("fac-pune-dh");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastAnalysisTimestamp, setLastAnalysisTimestamp] = useState<string>("Live Stream Active");
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState<boolean>(false);

  const simulationResult: SimulationResult = useMemo(() => {
    return runCascadeSimulation({
      facilities,
      inventories,
      referralLinks,
      selectedDrugId,
      selectedDistrict,
      currentSimDay,
      horizonDays,
      selectedFacilityId: selectedFacilityId || undefined,
    });
  }, [
    facilities,
    inventories,
    referralLinks,
    selectedDrugId,
    selectedDistrict,
    currentSimDay,
    horizonDays,
    selectedFacilityId,
  ]);

  const selectedDrug = useMemo(() => {
    return drugs.find((d) => d.id === selectedDrugId);
  }, [drugs, selectedDrugId]);

  const currentSelectedState = useMemo(() => {
    if (!selectedFacilityId) return simulationResult.facilityStateList[0] || null;
    return simulationResult.facilityStates.get(selectedFacilityId) || simulationResult.facilityStateList[0] || null;
  }, [selectedFacilityId, simulationResult]);

  const focalFacilityId = simulationResult.cascade.primaryFacility?.id || selectedFacilityId;

  const handleRunAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setLastAnalysisTimestamp(new Date().toLocaleTimeString());
    }, 450);
  }, []);

  const handleSelectDistrict = useCallback(
    (dist: string) => {
      setSelectedDistrict(dist);
      setCurrentSimDay(0);
      setIsPlaying(false);
      const inDist = facilities.filter((f) =>
        dist === "all" ? true : f.district.toLowerCase() === dist.toLowerCase()
      );
      if (inDist.length > 0) {
        setSelectedFacilityId(inDist[0].id);
      }
    },
    [facilities]
  );

  const handleSelectDrug = useCallback((drugId: string) => {
    setSelectedDrugId(drugId);
  }, []);

  const handleChangeHorizon = useCallback((horizon: number) => {
    setHorizonDays(horizon);
    setCurrentSimDay((prev) => Math.min(prev, horizon));
  }, []);

  const handleSelectFacility = useCallback((facilityId: string) => {
    setSelectedFacilityId(facilityId);
  }, []);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-black text-[#ededed] font-sans selection:bg-white selection:text-black">
      {/* Deep-Dive Side Drawer (opens upon clicking hamburger button) */}
      <DeepDivePanel
        isOpen={isDeepDiveOpen}
        onClose={() => setIsDeepDiveOpen(false)}
        selectedState={currentSelectedState}
        selectedDrug={selectedDrug}
        simDay={currentSimDay}
        horizonDays={horizonDays}
        onSelectSimDay={setCurrentSimDay}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        cascade={simulationResult.cascade}
        facilityStates={simulationResult.facilityStateList}
        selectedFacilityId={selectedFacilityId}
        onSelectFacility={handleSelectFacility}
      />

      {/* Clean Dashboard Header (Ribbon completely removed) */}
      <DashboardHeader
        districts={districts}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleSelectDistrict}
        drugs={drugs}
        selectedDrugId={selectedDrugId}
        onSelectDrug={handleSelectDrug}
        horizonDays={horizonDays}
        onChangeHorizon={handleChangeHorizon}
        onRunAnalysis={handleRunAnalysis}
        isAnalyzing={isAnalyzing}
        lastAnalysisTimestamp={lastAnalysisTimestamp}
        onOpenSideNav={() => setIsDeepDiveOpen(true)}
      />

      {/* Main Dashboard Screen: Network Map on the Left, 5 Stats Boxes on the Right */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-3 lg:py-3.5 flex flex-col min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch flex-1 min-h-0">
          {/* Left Side: Healthcare Facility Risk & Referral Topology Map (7 cols on lg, 8 cols on xl) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-[420px] lg:min-h-0">
            <FacilityRiskMap
              facilityStates={simulationResult.facilityStateList}
              referralLinks={referralLinks}
              selectedFacilityId={selectedFacilityId}
              onSelectFacility={handleSelectFacility}
              cascadeActiveLinks={simulationResult.cascade.affectedReferralLinkIds}
              focalFacilityId={focalFacilityId}
              simDay={currentSimDay}
            />
          </div>

          {/* Right Side: Macro Overview / 5 Stats Boxes (5 cols on lg, 4 cols on xl) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 justify-between">
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#222222] shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white text-xs uppercase tracking-wider font-mono">
                  Macro Overview &bull; District Health KPIs
                </span>
              </div>
              <button
                onClick={() => setIsDeepDiveOpen(true)}
                className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Full Deep Dive</span>
                <ArrowRight className="w-3 h-3" />
              </button>
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
          </div>
        </div>
      </main>
    </div>
  );
}
