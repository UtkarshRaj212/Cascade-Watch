"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ReferralLink } from "@/lib/db/schema";
import { FacilitySimulationState } from "@/lib/simulation";
import { Loader2 } from "lucide-react";

const FacilityOsmMap = dynamic(
  () => import("./FacilityOsmMap").then((mod) => mod.FacilityOsmMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full bg-black border border-[#222222] rounded-xl overflow-hidden shadow-sm items-center justify-center text-neutral-400 font-mono text-xs gap-3 min-h-[380px]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <div className="text-center">
          <span className="text-white font-semibold block text-sm mb-0.5">Initializing OpenStreetMap</span>
          <span className="text-neutral-500 text-xs">Loading geographic tiles and facility coordinates...</span>
        </div>
      </div>
    ),
  }
);

export interface FacilityRiskMapProps {
  facilityStates: FacilitySimulationState[];
  referralLinks: ReferralLink[];
  selectedFacilityId: string | null;
  onSelectFacility: (facilityId: string) => void;
  cascadeActiveLinks: number[];
  focalFacilityId: string | null;
  simDay: number;
}

export function FacilityRiskMap(props: FacilityRiskMapProps) {
  return <FacilityOsmMap {...props} />;
}
