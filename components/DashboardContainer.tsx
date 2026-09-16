"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Facility, Drug, FacilityInventory, ReferralLink } from "@/lib/db/schema";
import { runCascadeSimulation, SimulationResult } from "@/lib/simulation";
import { DashboardHeader } from "./DashboardHeader";
import { SideNav, DashboardSection } from "./SideNav";
import { KpiSummary } from "./KpiSummary";
import { FacilityRiskMap } from "./FacilityRiskMap";
import { RiskAlertPanel } from "./RiskAlertPanel";
import { FacilityDetails } from "./FacilityDetails";
import { StockTrajectoryChart } from "./StockTrajectoryChart";
import { CascadeSummary } from "./CascadeSummary";
import { CascadeTimeline } from "./CascadeTimeline";
import { Activity, Network, Waves, TrendingDown, ShieldAlert, Layers } from "lucide-react";

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
  const [lastAnalysisTimestamp, setLastAnalysisTimestamp] = useState<string>("Live Telemetry Stream");
  const [isSideNavOpen, setIsSideNavOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>("all");

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

  const shouldShowSection = (section: DashboardSection) => {
    return activeSection === "all" || activeSection === section;
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-[#ededed] font-sans selection:bg-white selection:text-black">
      {/* Side Navigation Drawer (Vercel Style) */}
      <SideNav
        isOpen={isSideNavOpen}
        onClose={() => setIsSideNavOpen(false)}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        selectedDistrict={selectedDistrict}
        selectedDrugName={selectedDrug?.name || "Essential Medicine"}
        horizonDays={horizonDays}
        totalFacilitiesCount={simulationResult.facilityStateList.length}
        criticalCount={simulationResult.kpis.criticalFacilities}
      />

      {/* Dashboard Header with Hamburger and Section Navigation */}
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
        onOpenSideNav={() => setIsSideNavOpen(true)}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
      />

      {/* Main Content Workspace - Vercel Spacious Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-6 py-8 space-y-10">

        {/* SECTION 1: Executive Macro Overview & Regional KPIs */}
        {shouldShowSection("overview") && (
          <section id="section-overview" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222222] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-white">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-white tracking-tight font-mono">
                    1. Regional Supply Chain Overview & Macro KPIs
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">
                    District-wide situational awareness &bull; Cumulative deficit metrics over {horizonDays}-day horizon
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-neutral-400 bg-[#0a0a0a] border border-[#222222] px-3 py-1.5 rounded-lg">
                Scope: <span className="text-white font-semibold">{selectedDistrict === "all" ? "All Districts" : `${selectedDistrict} District`}</span> &bull; <span className="text-white font-semibold">{selectedDrug?.name}</span>
              </div>
            </div>

            {/* KPI Cards Grid */}
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
          </section>
        )}

        {/* SECTION 2: Regional Network Topology & Referral Vulnerability Map */}
        {shouldShowSection("network-map") && (
          <section id="section-network-map" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222222] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-white">
                  <Network className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-white tracking-tight font-mono">
                    2. Healthcare Facility Risk & Referral Topology Map
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">
                    Spatial layout of healthcare facilities, clinical tiers, and patient referral transfer vectors
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-neutral-400 bg-[#0a0a0a] border border-[#222222] px-3 py-1.5 rounded-lg">
                Interactive: Click any node to audit facility & trajectory
              </div>
            </div>

            {/* Map Container */}
            <div className="h-[520px]">
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
          </section>
        )}

        {/* SECTION 3: Cascade Propagation & Ripple Spillover Analysis */}
        {shouldShowSection("cascade-intel") && (
          <section id="section-cascade-intel" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222222] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-white">
                  <Waves className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-white tracking-tight font-mono">
                    3. Cascade Propagation & Referral Spillover Analysis
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">
                    Simulate how stockout at the primary hospital deflects demand onto secondary referral facilities
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-neutral-400 bg-[#0a0a0a] border border-[#222222] px-3 py-1.5 rounded-lg">
                Cascade Engine: Day T+{currentSimDay} &bull; Wave: {simulationResult.cascade.cascadeWaveReached.split(" - ")[0]}
              </div>
            </div>

            {/* Interactive Timeline Scrubber */}
            <CascadeTimeline
              simDay={currentSimDay}
              horizonDays={horizonDays}
              onSelectSimDay={setCurrentSimDay}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              primaryStockoutDay={simulationResult.cascade.primaryStockoutDay}
              replenishmentDeliveryDay={currentSelectedState?.inventory.nextDeliveryDays || null}
            />

            {/* Cascade Summary Details */}
            <CascadeSummary
              cascade={simulationResult.cascade}
              selectedDrug={selectedDrug}
              simDay={currentSimDay}
              onSelectFacility={handleSelectFacility}
            />
          </section>
        )}

        {/* SECTION 4: Inventory Depletion & Stockout Horizon Forecasting */}
        {shouldShowSection("trajectory") && (
          <section id="section-trajectory" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222222] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-white">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-white tracking-tight font-mono">
                    4. Inventory Depletion Trajectory & Replenishment Horizon
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">
                    Daily stock curve, safety reserve boundary, and projected zero-stockout crossing point
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-neutral-400 bg-[#0a0a0a] border border-[#222222] px-3 py-1.5 rounded-lg">
                Target: <span className="text-white font-semibold">{currentSelectedState?.facility.name || "Selected Facility"}</span>
              </div>
            </div>

            {/* Interactive Trajectory Chart */}
            <StockTrajectoryChart
              selectedState={currentSelectedState}
              selectedDrug={selectedDrug}
              horizonDays={horizonDays}
              simDay={currentSimDay}
              onSelectSimDay={setCurrentSimDay}
            />
          </section>
        )}

        {/* SECTION 5: Early Warning Risk Alerts & Facility Operational Audit */}
        {shouldShowSection("alerts-inspector") && (
          <section id="section-alerts-inspector" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222222] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-white">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-white tracking-tight font-mono">
                    5. Early Warning Risk Alerts & Operational Facility Audit
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">
                    Ranked priority intervention feed paired with comprehensive facility diagnostic inspector
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-neutral-400 bg-[#0a0a0a] border border-[#222222] px-3 py-1.5 rounded-lg">
                Auditing: <span className="text-white font-semibold">{currentSelectedState?.facility.name || "None"}</span>
              </div>
            </div>

            {/* 2-Column Grid: Alerts on Left, Facility Audit on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Ranked Risk Alerts (5 cols) */}
              <div className="lg:col-span-6 h-[500px]">
                <RiskAlertPanel
                  facilityStates={simulationResult.facilityStateList}
                  selectedDrug={selectedDrug}
                  selectedFacilityId={selectedFacilityId}
                  onSelectFacility={handleSelectFacility}
                />
              </div>

              {/* Facility Details Deep Dive (7 cols) */}
              <div className="lg:col-span-6">
                <FacilityDetails
                  selectedState={currentSelectedState}
                  selectedDrug={selectedDrug}
                  simDay={currentSimDay}
                />
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
