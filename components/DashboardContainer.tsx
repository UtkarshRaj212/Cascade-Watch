"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Facility, Drug, FacilityInventory, ReferralLink } from "@/lib/db/schema";
import { runCascadeSimulation, SimulationResult } from "@/lib/simulation";
import { DashboardHeader } from "./DashboardHeader";
import { KpiSummary } from "./KpiSummary";
import { FacilityRiskMap } from "./FacilityRiskMap";
import { RiskAlertPanel } from "./RiskAlertPanel";
import { FacilityDetails } from "./FacilityDetails";
import { StockTrajectoryChart } from "./StockTrajectoryChart";
import { CascadeSummary } from "./CascadeSummary";
import { CascadeTimeline } from "./CascadeTimeline";

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

  // Extract unique districts
  const districts = useMemo(() => {
    return Array.from(new Set(facilities.map((f) => f.district))).sort();
  }, [facilities]);

  // State
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

  // Run simulation reactively
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

  // Currently selected drug
  const selectedDrug = useMemo(() => {
    return drugs.find((d) => d.id === selectedDrugId);
  }, [drugs, selectedDrugId]);

  // Currently selected facility state
  const currentSelectedState = useMemo(() => {
    if (!selectedFacilityId) return simulationResult.facilityStateList[0] || null;
    return simulationResult.facilityStates.get(selectedFacilityId) || simulationResult.facilityStateList[0] || null;
  }, [selectedFacilityId, simulationResult]);

  // Focal facility for cascade (usually the epicenter critical facility or selected)
  const focalFacilityId = simulationResult.cascade.primaryFacility?.id || selectedFacilityId;

  // Handle Run Analysis action
  const handleRunAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setLastAnalysisTimestamp(new Date().toLocaleTimeString());
    }, 450);
  }, []);

  // Handle District Change
  const handleSelectDistrict = useCallback(
    (dist: string) => {
      setSelectedDistrict(dist);
      setCurrentSimDay(0);
      setIsPlaying(false);
      // Auto-focus first critical facility in the selected district
      const inDist = facilities.filter((f) =>
        dist === "all" ? true : f.district.toLowerCase() === dist.toLowerCase()
      );
      if (inDist.length > 0) {
        setSelectedFacilityId(inDist[0].id);
      }
    },
    [facilities]
  );

  // Handle Drug Change
  const handleSelectDrug = useCallback((drugId: string) => {
    setSelectedDrugId(drugId);
  }, []);

  // Handle Horizon Change
  const handleChangeHorizon = useCallback((horizon: number) => {
    setHorizonDays(horizon);
    setCurrentSimDay((prev) => Math.min(prev, horizon));
  }, []);

  // Handle Facility Click
  const handleSelectFacility = useCallback((facilityId: string) => {
    setSelectedFacilityId(facilityId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. Dashboard Header */}
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
      />

      {/* 2. KPI Summary */}
      <KpiSummary
        criticalFacilities={simulationResult.kpis.criticalFacilities}
        facilitiesAtRisk={simulationResult.kpis.facilitiesAtRisk}
        expectedStockouts={simulationResult.kpis.expectedStockouts}
        unmetDemandUnits={simulationResult.kpis.unmetDemandUnits}
        averageDaysCover={simulationResult.kpis.averageDaysCover}
        unit={selectedDrug?.unit || "vials"}
        horizonDays={horizonDays}
        simDay={currentSimDay}
      />

      {/* 3. Cascade Timeline Simulation Controller */}
      <div className="px-4 pb-2">
        <CascadeTimeline
          simDay={currentSimDay}
          horizonDays={horizonDays}
          onSelectSimDay={setCurrentSimDay}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          primaryStockoutDay={simulationResult.cascade.primaryStockoutDay}
          replenishmentDeliveryDay={currentSelectedState?.inventory.nextDeliveryDays || null}
        />
      </div>

      {/* Main Operational Workspace Grid */}
      <main className="flex-1 px-4 pb-6 space-y-4">
        {/* Row 1: Map + Alert Panel + Details Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left / Center Area: Geographic Network Risk Map (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="h-[430px]">
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

            {/* Cascade Summary Panel positioned directly underneath the map */}
            <CascadeSummary
              cascade={simulationResult.cascade}
              selectedDrug={selectedDrug}
              simDay={currentSimDay}
              onSelectFacility={handleSelectFacility}
            />
          </div>

          {/* Right Column: Ranked Risk Alerts (5 cols) & Facility Details */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Facility Details Deep Dive */}
            <FacilityDetails
              selectedState={currentSelectedState}
              selectedDrug={selectedDrug}
              simDay={currentSimDay}
            />

            {/* Ranked Risk Alerts List */}
            <div className="h-[340px]">
              <RiskAlertPanel
                facilityStates={simulationResult.facilityStateList}
                selectedDrug={selectedDrug}
                selectedFacilityId={selectedFacilityId}
                onSelectFacility={handleSelectFacility}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Interactive Stock Trajectory & Burn Horizon Chart */}
        <div className="w-full">
          <StockTrajectoryChart
            selectedState={currentSelectedState}
            selectedDrug={selectedDrug}
            horizonDays={horizonDays}
            simDay={currentSimDay}
            onSelectSimDay={setCurrentSimDay}
          />
        </div>
      </main>
    </div>
  );
}
