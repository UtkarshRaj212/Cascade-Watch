"use client";

import React, { useState, useMemo } from "react";
import { Facility, ReferralLink } from "@/lib/db/schema";
import { FacilitySimulationState } from "@/lib/simulation";
import { ZoomIn, ZoomOut, RotateCcw, Network, Info } from "lucide-react";

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

  // Compute bounding box for projection
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

    // Add padding margin
    const latSpan = Math.max(maxLat - minLat, 0.2);
    const lngSpan = Math.max(maxLng - minLng, 0.2);

    const padLat = latSpan * 0.18;
    const padLng = lngSpan * 0.18;

    const paddedMinLat = minLat - padLat;
    const paddedMaxLat = maxLat + padLat;
    const paddedMinLng = minLng - padLng;
    const paddedMaxLng = maxLng + padLng;

    // Viewbox width and height
    const width = 800;
    const height = 500;

    const map = new Map<string, { x: number; y: number }>();

    facilityStates.forEach(({ facility }) => {
      // Longitude -> X (left to right)
      const x = ((facility.longitude - paddedMinLng) / (paddedMaxLng - paddedMinLng)) * (width - 120) + 60;
      // Latitude -> Y (inverted, top is north/higher latitude)
      const y = ((paddedMaxLat - facility.latitude) / (paddedMaxLat - paddedMinLat)) * (height - 100) + 50;
      map.set(facility.id, { x, y });
    });

    return {
      coordsMap: map,
      bounds: { minLat, maxLat, minLng, maxLng },
    };
  }, [facilityStates]);

  const activeLinkSet = useMemo(() => new Set(cascadeActiveLinks), [cascadeActiveLinks]);

  // Color mapping based on risk state
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
        return { fill: "#64748b", stroke: "#475569", text: "text-slate-400", bg: "bg-slate-500" };
    }
  };

  const hoveredState = hoveredFacilityId
    ? facilityStates.find((s) => s.facility.id === hoveredFacilityId)
    : null;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded overflow-hidden">
      {/* Map Control Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900/90 text-xs">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-rose-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Facility Risk & Referral Network Map
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ({facilityStates.length} nodes &bull; {referralLinks.length} referral pathways)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400 mr-2 border-r border-slate-800 pr-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Warning
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low Risk
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> No Data
            </span>
          </div>

          {/* Zoom Actions */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.0))}
              title="Zoom In"
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
              title="Zoom Out"
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              title="Reset View"
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              aria-label="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden min-h-[380px]">
        {/* Subtle coordinate grid backdrop */}
        <svg
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.6" />
            </pattern>

            {/* Marker for directed referral arrows */}
            <marker id="arrow" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" opacity="0.6" />
            </marker>

            <marker id="arrow-active" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
            </marker>

            {/* Pulsing glow filter */}
            <filter id="glow-rose" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g transform={`scale(${zoomLevel}) translate(${panOffset.x}, ${panOffset.y})`}>
            {/* 1. Referral Link Lines */}
            {referralLinks.map((link) => {
              const src = coordsMap.get(link.sourceFacilityId);
              const tgt = coordsMap.get(link.targetFacilityId);
              if (!src || !tgt) return null;

              const isCascadeActive = activeLinkSet.has(link.id);

              return (
                <g key={link.id}>
                  {/* Outer subtle shadow or glow for active deflection links */}
                  {isCascadeActive && (
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke="#f43f5e"
                      strokeWidth="5"
                      strokeOpacity="0.35"
                      strokeDasharray="6 3"
                    />
                  )}
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isCascadeActive ? "#f43f5e" : "#334155"}
                    strokeWidth={isCascadeActive ? "2.5" : "1.2"}
                    strokeDasharray={isCascadeActive ? "5 3" : undefined}
                    strokeOpacity={isCascadeActive ? "0.9" : "0.55"}
                    markerEnd={isCascadeActive ? "url(#arrow-active)" : "url(#arrow)"}
                  />
                  {/* Subtle label on deflection link */}
                  {isCascadeActive && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 6}
                      fill="#fda4af"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none font-bold"
                    >
                      deflection ({Math.round((link.transferVolumeShare || 0.35) * 100)}%)
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

              // Size radius according to tier
              const radius =
                state.facility.tier === "Tertiary"
                  ? 12
                  : state.facility.tier === "Secondary"
                  ? 9
                  : 7;

              return (
                <g
                  key={state.facility.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  className="cursor-pointer transition-transform"
                  onClick={() => onSelectFacility(state.facility.id)}
                  onMouseEnter={() => setHoveredFacilityId(state.facility.id)}
                  onMouseLeave={() => setHoveredFacilityId(null)}
                >
                  {/* Ripple pulse for focal critical facility */}
                  {isFocal && state.dynamicRiskStatus === "critical" && (
                    <circle
                      r={radius + 14}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Focus Ring if selected */}
                  {isSelected && (
                    <circle
                      r={radius + 7}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                      className="animate-spin"
                      style={{ transformOrigin: "0 0", animationDuration: "8s" }}
                    />
                  )}

                  {/* Secondary halo */}
                  <circle
                    r={radius + 4}
                    fill={colors.fill}
                    opacity={isSelected || isHovered ? "0.35" : "0.15"}
                  />

                  {/* Main Node Shape */}
                  {state.facility.tier === "Tertiary" ? (
                    // Distinct square/diamond for tertiary district hospital
                    <rect
                      x={-radius}
                      y={-radius}
                      width={radius * 2}
                      height={radius * 2}
                      rx="2"
                      fill={colors.fill}
                      stroke={isSelected ? "#ffffff" : colors.stroke}
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      filter={state.dynamicRiskStatus === "critical" ? "url(#glow-rose)" : undefined}
                    />
                  ) : (
                    <circle
                      r={radius}
                      fill={colors.fill}
                      stroke={isSelected ? "#ffffff" : colors.stroke}
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      filter={state.dynamicRiskStatus === "critical" ? "url(#glow-rose)" : undefined}
                    />
                  )}

                  {/* Tier icon / dot */}
                  <circle r={radius * 0.35} fill="#0f172a" />

                  {/* Text Label */}
                  <text
                    x={radius + 6}
                    y="4"
                    fill={isSelected ? "#ffffff" : "#cbd5e1"}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight={isSelected || isFocal ? "700" : "500"}
                    className="select-none pointer-events-none drop-shadow-md"
                  >
                    {state.facility.name.replace("Hospital", "Hosp").replace("Community Health Center", "CHC").replace("Primary Health Center", "PHC")}
                  </text>

                  {/* Cover badge label below */}
                  <text
                    x={radius + 6}
                    y="15"
                    fill={colors.fill}
                    fontSize="9"
                    fontFamily="monospace"
                    className="select-none pointer-events-none"
                  >
                    {state.dynamicRiskStatus === "insufficient_data"
                      ? "NO DATA"
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
          <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-slate-700 rounded p-2.5 shadow-xl text-xs z-20 pointer-events-none font-mono min-w-[240px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
              <span className="font-bold text-white text-[13px]">{hoveredState.facility.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                hoveredState.dynamicRiskStatus === "critical"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : hoveredState.dynamicRiskStatus === "warning"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : hoveredState.dynamicRiskStatus === "low"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-700 text-slate-300"
              }`}>
                {hoveredState.dynamicRiskStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300 text-[11px]">
              <div>
                <span className="text-slate-500">Tier: </span>
                <span className="text-slate-200">{hoveredState.facility.tier} ({hoveredState.facility.facilityType})</span>
              </div>
              <div>
                <span className="text-slate-500">Current Stock: </span>
                <span className="font-bold text-white">{hoveredState.currentStockAtDay} units</span>
              </div>
              <div>
                <span className="text-slate-500">Days Cover: </span>
                <span className="font-bold text-amber-400">{hoveredState.effectiveDaysCover} days</span>
              </div>
              <div>
                <span className="text-slate-500">Stockout Risk: </span>
                <span className="font-bold text-rose-400">{Math.round(hoveredState.dynamicRiskProbability * 100)}%</span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 truncate">
              Driver: {hoveredState.inventory.riskDriver}
            </div>
          </div>
        )}
      </div>

      {/* Map Footer Bar */}
      <div className="px-3 py-1.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Click facility node to inspect stock trajectory & cascade ripple</span>
        <span>Red dashed arcs indicate active demand deflection</span>
      </div>
    </div>
  );
}
