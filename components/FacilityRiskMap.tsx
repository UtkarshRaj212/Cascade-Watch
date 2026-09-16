"use client";

import React, { useState, useMemo } from "react";
import { Facility, ReferralLink } from "@/lib/db/schema";
import { FacilitySimulationState } from "@/lib/simulation";
import { ZoomIn, ZoomOut, RotateCcw, Network } from "lucide-react";

interface FacilityRiskMapProps {
  facilityStates: FacilitySimulationState[];
  referralLinks: ReferralLink[];
  selectedFacilityId: string | null;
  onSelectFacility: (facilityId: string) => void;
  cascadeActiveLinks: number[];
  focalFacilityId: string | null;
  simDay: number;
}

export function FacilityRiskMap({
  facilityStates,
  referralLinks,
  selectedFacilityId,
  onSelectFacility,
  cascadeActiveLinks,
  focalFacilityId,
  simDay,
}: FacilityRiskMapProps) {
  const [hoveredFacilityId, setHoveredFacilityId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { coordsMap, bounds } = useMemo(() => {
    if (facilityStates.length === 0) {
      return { coordsMap: new Map<string, { x: number; y: number }>(), bounds: null };
    }

    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;

    facilityStates.forEach(({ facility }) => {
      if (facility.latitude < minLat) minLat = facility.latitude;
      if (facility.latitude > maxLat) maxLat = facility.latitude;
      if (facility.longitude < minLng) minLng = facility.longitude;
      if (facility.longitude > maxLng) maxLng = facility.longitude;
    });

    const latSpan = Math.max(maxLat - minLat, 0.2);
    const lngSpan = Math.max(maxLng - minLng, 0.2);

    const padLat = latSpan * 0.18;
    const padLng = lngSpan * 0.18;

    const paddedMinLat = minLat - padLat;
    const paddedMaxLat = maxLat + padLat;
    const paddedMinLng = minLng - padLng;
    const paddedMaxLng = maxLng + padLng;

    const width = 850;
    const height = 520;

    const map = new Map<string, { x: number; y: number }>();

    facilityStates.forEach(({ facility }) => {
      const x = ((facility.longitude - paddedMinLng) / (paddedMaxLng - paddedMinLng)) * (width - 140) + 70;
      const y = ((paddedMaxLat - facility.latitude) / (paddedMaxLat - paddedMinLat)) * (height - 110) + 55;
      map.set(facility.id, { x, y });
    });

    return {
      coordsMap: map,
      bounds: { minLat, maxLat, minLng, maxLng },
    };
  }, [facilityStates]);

  const activeLinkSet = useMemo(() => new Set(cascadeActiveLinks), [cascadeActiveLinks]);

  const getRiskColor = (status: "critical" | "warning" | "low" | "insufficient_data") => {
    switch (status) {
      case "critical":
        return { fill: "#f43f5e", stroke: "#e11d48", text: "text-rose-400", bg: "bg-rose-500" };
      case "warning":
        return { fill: "#f59e0b", stroke: "#d97706", text: "text-amber-400", bg: "bg-amber-500" };
      case "low":
        return { fill: "#10b981", stroke: "#059669", text: "text-emerald-400", bg: "bg-emerald-500" };
      case "insufficient_data":
      default:
        return { fill: "#525252", stroke: "#404040", text: "text-neutral-400", bg: "bg-neutral-600" };
    }
  };

  const hoveredState = hoveredFacilityId
    ? facilityStates.find((s) => s.facility.id === hoveredFacilityId)
    : null;

  return (
    <div className="flex flex-col h-full bg-black border border-[#222222] rounded-xl overflow-hidden shadow-sm">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-[#222222] bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-neutral-300" />
          <div>
            <span className="font-semibold text-white text-sm uppercase tracking-wider font-mono block">
              Healthcare Facility Risk & Referral Topology Map
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Spatial nodes positioned by real geographic coordinates &bull; {facilityStates.length} monitoring sites
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3.5 text-xs font-mono text-neutral-300 mr-2 border-r border-[#262626] pr-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span> Critical / Stockout
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Warning Buffer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Healthy Reserve
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-neutral-600"></span> No Telemetry
            </span>
          </div>

          {/* Zoom Actions */}
          <div className="flex items-center gap-1 bg-black border border-[#262626] rounded-lg p-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
              title="Zoom In"
              className="p-1.5 hover:bg-[#1a1a1a] text-neutral-300 hover:text-white rounded-md transition-colors"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
              title="Zoom Out"
              className="p-1.5 hover:bg-[#1a1a1a] text-neutral-300 hover:text-white rounded-md transition-colors"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              title="Reset View"
              className="p-1.5 hover:bg-[#1a1a1a] text-neutral-300 hover:text-white rounded-md transition-colors"
              aria-label="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 bg-black overflow-hidden min-h-0">
        <svg
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          viewBox="0 0 850 520"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="spacious-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#161616" strokeWidth="0.8" />
            </pattern>

            <marker id="arrow" viewBox="0 0 10 10" refX="17" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#525252" opacity="0.8" />
            </marker>

            <marker id="arrow-active" viewBox="0 0 10 10" refX="19" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
            </marker>

            <filter id="glow-rose-spacious" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="100%" height="100%" fill="url(#spacious-grid)" />

          <g transform={`scale(${zoomLevel}) translate(${panOffset.x}, ${panOffset.y})`}>
            {/* 1. Referral Link Lines */}
            {referralLinks.map((link) => {
              const src = coordsMap.get(link.sourceFacilityId);
              const tgt = coordsMap.get(link.targetFacilityId);
              if (!src || !tgt) return null;

              const isCascadeActive = activeLinkSet.has(link.id);

              return (
                <g key={link.id}>
                  {isCascadeActive && (
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke="#f43f5e"
                      strokeWidth="6"
                      strokeOpacity="0.35"
                      strokeDasharray="6 3"
                    />
                  )}
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isCascadeActive ? "#f43f5e" : "#282828"}
                    strokeWidth={isCascadeActive ? "2.8" : "1.4"}
                    strokeDasharray={isCascadeActive ? "6 3" : undefined}
                    strokeOpacity={isCascadeActive ? "0.95" : "0.75"}
                    markerEnd={isCascadeActive ? "url(#arrow-active)" : "url(#arrow)"}
                  />
                  {isCascadeActive && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 8}
                      fill="#fda4af"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none"
                    >
                      Patient Deflection ({Math.round((link.transferVolumeShare || 0.35) * 100)}%)
                    </text>
                  )}
                </g>
              );
            })}

            {/* 2. Facility Nodes */}
            {facilityStates.map((state) => {
              const coords = coordsMap.get(state.facility.id);
              if (!coords) return null;

              const isSelected = selectedFacilityId === state.facility.id;
              const isFocal = focalFacilityId === state.facility.id;
              const isHovered = hoveredFacilityId === state.facility.id;
              const colors = getRiskColor(state.dynamicRiskStatus);

              const radius =
                state.facility.tier === "Tertiary"
                  ? 14
                  : state.facility.tier === "Secondary"
                    ? 11
                    : 8;

              return (
                <g
                  key={state.facility.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  className="cursor-pointer transition-transform"
                  onClick={() => onSelectFacility(state.facility.id)}
                  onMouseEnter={() => setHoveredFacilityId(state.facility.id)}
                  onMouseLeave={() => setHoveredFacilityId(null)}
                >
                  {/* Ping animation for focal critical epicenter */}
                  {isFocal && state.dynamicRiskStatus === "critical" && (
                    <circle
                      r={radius + 16}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      opacity="0.65"
                      className="animate-ping"
                    />
                  )}

                  {/* Focus Ring if selected */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ transformOrigin: "0 0", animationDuration: "10s" }}
                    />
                  )}

                  {/* Secondary halo */}
                  <circle
                    r={radius + 5}
                    fill={colors.fill}
                    opacity={isSelected || isHovered ? "0.35" : "0.12"}
                  />

                  {/* Main Node Shape */}
                  {state.facility.tier === "Tertiary" ? (
                    <rect
                      x={-radius}
                      y={-radius}
                      width={radius * 2}
                      height={radius * 2}
                      rx="3"
                      fill={colors.fill}
                      stroke={isSelected ? "#ffffff" : colors.stroke}
                      strokeWidth={isSelected ? "2.5" : "1.8"}
                      filter={state.dynamicRiskStatus === "critical" ? "url(#glow-rose-spacious)" : undefined}
                    />
                  ) : (
                    <circle
                      r={radius}
                      fill={colors.fill}
                      stroke={isSelected ? "#ffffff" : colors.stroke}
                      strokeWidth={isSelected ? "2.5" : "1.8"}
                      filter={state.dynamicRiskStatus === "critical" ? "url(#glow-rose-spacious)" : undefined}
                    />
                  )}

                  {/* Center Dot */}
                  <circle r={radius * 0.35} fill="#000000" />

                  {/* Text Label - increased size */}
                  <text
                    x={radius + 8}
                    y="4"
                    fill={isSelected ? "#ffffff" : "#ededed"}
                    fontSize="12"
                    fontFamily="monospace"
                    fontWeight={isSelected || isFocal ? "700" : "500"}
                    className="select-none pointer-events-none drop-shadow-md"
                  >
                    {state.facility.name.replace("Hospital", "Hosp").replace("Community Health Center", "CHC").replace("Primary Health Center", "PHC")}
                  </text>

                  {/* Cover badge label below - increased size */}
                  <text
                    x={radius + 8}
                    y="18"
                    fill={colors.fill}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="600"
                    className="select-none pointer-events-none"
                  >
                    {state.dynamicRiskStatus === "insufficient_data"
                      ? "NO TELEMETRY"
                      : state.isStockedOutNow
                        ? "STOCKED OUT"
                        : `${state.effectiveDaysCover}d cover`}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredState && (
          <div className="absolute bottom-4 left-4 bg-[#0a0a0a]/95 border border-[#333333] rounded-lg p-3.5 shadow-2xl text-xs z-20 pointer-events-none font-mono min-w-[270px]">
            <div className="flex items-center justify-between border-b border-[#222222] pb-2 mb-2">
              <span className="font-bold text-white text-sm">{hoveredState.facility.name}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${hoveredState.dynamicRiskStatus === "critical"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  : hoveredState.dynamicRiskStatus === "warning"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : hoveredState.dynamicRiskStatus === "low"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-neutral-800 text-neutral-300"
                }`}>
                {hoveredState.dynamicRiskStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-neutral-300 text-xs">
              <div>
                <span className="text-neutral-500">Tier: </span>
                <span className="text-white font-medium">{hoveredState.facility.tier} ({hoveredState.facility.facilityType})</span>
              </div>
              <div>
                <span className="text-neutral-500">Current Stock: </span>
                <span className="font-bold text-white">{hoveredState.currentStockAtDay} units</span>
              </div>
              <div>
                <span className="text-neutral-500">Days Cover: </span>
                <span className="font-bold text-amber-400">{hoveredState.effectiveDaysCover} days</span>
              </div>
              <div>
                <span className="text-neutral-500">Stockout Risk: </span>
                <span className="font-bold text-rose-400">{Math.round(hoveredState.dynamicRiskProbability * 100)}%</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#222222] text-xs text-neutral-400">
              <span className="text-neutral-500 font-semibold">Root Driver: </span>
              {hoveredState.inventory.riskDriver}
            </div>
          </div>
        )}
      </div>

      {/* Map Footer Bar */}
      <div className="px-4 py-2 border-t border-[#222222] bg-[#0a0a0a] flex items-center justify-between text-xs text-neutral-400 font-mono shrink-0">
        <span>Click any facility node to inspect stock trajectory & referral cascade propagation</span>
        <span className="text-neutral-500 hidden sm:inline">Arrows indicate regional escalation / deflection direction</span>
      </div>
    </div>
  );
}
