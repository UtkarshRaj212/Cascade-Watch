"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { Facility, Drug, FacilityInventory, ReferralLink } from "@/lib/db/schema";
import { runCascadeSimulation, SimulationResult, FacilitySimulationState } from "@/lib/simulation";

export interface InitialDashboardData {
  facilities: Facility[];
  drugs: Drug[];
  inventories: FacilityInventory[];
  referralLinks: ReferralLink[];
}

export interface DashboardContextType {
  facilities: Facility[];
  drugs: Drug[];
  inventories: FacilityInventory[];
  referralLinks: ReferralLink[];
  districts: string[];
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  selectedDrugId: string;
  setSelectedDrugId: (drugId: string) => void;
  selectedDrug: Drug | undefined;
  horizonDays: number;
  setHorizonDays: (days: number) => void;
  currentSimDay: number;
  setCurrentSimDay: React.Dispatch<React.SetStateAction<number>>;
  selectedFacilityId: string | null;
  setSelectedFacilityId: (facilityId: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isAnalyzing: boolean;
  lastAnalysisTimestamp: string;
  runAnalysis: () => void;
  isSideNavOpen: boolean;
  setIsSideNavOpen: (open: boolean) => void;
  toggleSideNav: () => void;
  simulationResult: SimulationResult;
  currentSelectedState: FacilitySimulationState | null;
  focalFacilityId: string | null;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({
  initialData,
  children,
}: {
  initialData: InitialDashboardData;
  children: React.ReactNode;
}) {
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
  const [isSideNavOpen, setIsSideNavOpen] = useState<boolean>(false);

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
    return (
      simulationResult.facilityStates.get(selectedFacilityId) ||
      simulationResult.facilityStateList[0] ||
      null
    );
  }, [selectedFacilityId, simulationResult]);

  const focalFacilityId = simulationResult.cascade.primaryFacility?.id || selectedFacilityId;

  const runAnalysis = useCallback(() => {
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

  const handleSetHorizon = useCallback((horizon: number) => {
    setHorizonDays(horizon);
    setCurrentSimDay((prev) => Math.min(prev, horizon));
  }, []);

  const toggleSideNav = useCallback(() => {
    setIsSideNavOpen((prev) => !prev);
  }, []);

  const value = {
    facilities,
    drugs,
    inventories,
    referralLinks,
    districts,
    selectedDistrict,
    setSelectedDistrict: handleSelectDistrict,
    selectedDrugId,
    setSelectedDrugId,
    selectedDrug,
    horizonDays,
    setHorizonDays: handleSetHorizon,
    currentSimDay,
    setCurrentSimDay,
    selectedFacilityId,
    setSelectedFacilityId,
    isPlaying,
    setIsPlaying,
    isAnalyzing,
    lastAnalysisTimestamp,
    runAnalysis,
    isSideNavOpen,
    setIsSideNavOpen,
    toggleSideNav,
    simulationResult,
    currentSelectedState,
    focalFacilityId,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
