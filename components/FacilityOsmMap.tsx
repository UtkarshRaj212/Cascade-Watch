"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FacilitySimulationState } from "@/lib/simulation";
import { ReferralLink } from "@/lib/db/schema";
import { ZoomIn, ZoomOut, RotateCcw, Map as MapIcon, Layers, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

interface FacilityOsmMapProps {
  facilityStates: FacilitySimulationState[];
  referralLinks: ReferralLink[];
  selectedFacilityId: string | null;
  onSelectFacility: (facilityId: string) => void;
  cascadeActiveLinks: number[];
  focalFacilityId: string | null;
  simDay: number;
}

export function FacilityOsmMap({
  facilityStates,
  referralLinks,
  selectedFacilityId,
  onSelectFacility,
  cascadeActiveLinks,
  focalFacilityId,
  simDay,
}: FacilityOsmMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const linksLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);

  // Calculate bounding box for facilities
  const bounds = useMemo(() => {
    if (facilityStates.length === 0) return null;
    const latLngs = facilityStates.map((s) => [s.facility.latitude, s.facility.longitude] as [number, number]);
    return L.latLngBounds(latLngs);
  }, [facilityStates]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on Pune region
    const defaultCenter: [number, number] = [18.62, 73.85];
    const defaultZoom = 10;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      dragging: true,
      doubleClickZoom: true,
    });

    // Custom attribution
    L.control
      .attribution({
        position: "bottomright",
        prefix: false,
      })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" class="text-neutral-500 hover:underline">OpenStreetMap</a> contributors')
      .addTo(map);

    mapInstanceRef.current = map;

    // Standard OpenStreetMap Tile Layer
    const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: "abc",
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer groups for lines and markers
    const linksGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    linksLayerRef.current = linksGroup;
    markersLayerRef.current = markersGroup;

    setIsMapReady(true);

    // Initial fit bounds if facilities exist
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Referral Lines whenever simulation data or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !linksLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    const linksGroup = linksLayerRef.current;

    markersGroup.clearLayers();
    linksGroup.clearLayers();

    const facilityCoords = new Map<string, [number, number]>();
    facilityStates.forEach((s) => {
      facilityCoords.set(s.facility.id, [s.facility.latitude, s.facility.longitude]);
    });

    const activeLinkSet = new Set(cascadeActiveLinks);

    // 1. Draw Referral Links
    referralLinks.forEach((link) => {
      const src = facilityCoords.get(link.sourceFacilityId);
      const tgt = facilityCoords.get(link.targetFacilityId);
      if (!src || !tgt) return;

      const isCascadeActive = activeLinkSet.has(link.id);

      // Line style
      const line = L.polyline([src, tgt], {
        color: isCascadeActive ? "#f43f5e" : "#525252",
        weight: isCascadeActive ? 3.5 : 1.5,
        opacity: isCascadeActive ? 0.95 : 0.6,
        dashArray: isCascadeActive ? "6, 6" : undefined,
      });

      line.bindTooltip(
        `Referral Route: ${link.transferVolumeShare ? Math.round(link.transferVolumeShare * 100) : 35}% patient flow ${isCascadeActive ? "(ACTIVE DEFLECTION)" : ""
        }`,
        { className: "osm-custom-tooltip", sticky: true }
      );

      linksGroup.addLayer(line);

      // Center deflection badge for active cascade lines
      if (isCascadeActive) {
        const midLat = (src[0] + tgt[0]) / 2;
        const midLng = (src[1] + tgt[1]) / 2;
        const deflectionIcon = L.divIcon({
          className: "cascade-badge-icon",
          html: `
            <div style="
              background: rgba(225, 29, 72, 0.9);
              color: white;
              font-size: 10px;
              font-weight: 700;
              font-family: monospace;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid #fda4af;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.6);
              transform: translate(-50%, -50%);
            ">
              Deflection ${Math.round((link.transferVolumeShare || 0.35) * 100)}%
            </div>
          `,
          iconSize: [0, 0],
        });
        const badgeMarker = L.marker([midLat, midLng], { icon: deflectionIcon, interactive: false });
        linksGroup.addLayer(badgeMarker);
      }
    });

    // 2. Draw Facility Markers
    facilityStates.forEach((state) => {
      const { facility } = state;
      const isSelected = selectedFacilityId === facility.id;
      const isCritical = state.dynamicRiskStatus === "critical";
      const isWarning = state.dynamicRiskStatus === "warning";
      const isLow = state.dynamicRiskStatus === "low";

      // Color scheme
      let primaryColor = "#6b7280";
      let badgeBg = "rgba(107, 114, 128, 0.2)";
      let badgeBorder = "#4b5563";
      let statusText = `${state.effectiveDaysCover}d cover`;

      if (isCritical) {
        primaryColor = "#f43f5e";
        badgeBg = "rgba(244, 63, 94, 0.25)";
        badgeBorder = "#f43f5e";
        statusText = state.isStockedOutNow ? "STOCKED OUT" : `${state.effectiveDaysCover}d cover`;
      } else if (isWarning) {
        primaryColor = "#f59e0b";
        badgeBg = "rgba(245, 158, 11, 0.25)";
        badgeBorder = "#f59e0b";
        statusText = `${state.effectiveDaysCover}d cover`;
      } else if (isLow) {
        primaryColor = "#10b981";
        badgeBg = "rgba(16, 185, 129, 0.25)";
        badgeBorder = "#10b981";
        statusText = `${state.effectiveDaysCover}d cover`;
      }

      // Tier sizing
      const dotSize = facility.tier === "Tertiary" ? 14 : facility.tier === "Secondary" ? 11 : 9;

      const html = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <!-- Critical Pulse Ring -->
          ${isCritical
          ? `<div style="
                  position: absolute;
                  top: 0px;
                  width: ${dotSize * 2.4}px;
                  height: ${dotSize * 2.4}px;
                  border-radius: 50%;
                  background: rgba(244, 63, 94, 0.35);
                  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                  transform: translateY(-${dotSize * 0.2}px);
                  pointer-events: none;
                "></div>`
          : ""
        }

          <!-- Selection Outer Glow -->
          ${isSelected
          ? `<div style="
                  position: absolute;
                  top: -4px;
                  width: ${dotSize + 12}px;
                  height: ${dotSize + 12}px;
                  border-radius: 50%;
                  border: 2px solid #ffffff;
                  box-shadow: 0 0 12px rgba(255, 255, 255, 0.9);
                  pointer-events: none;
                "></div>`
          : ""
        }

          <!-- Core Node Dot -->
          <div style="
            width: ${dotSize}px;
            height: ${dotSize}px;
            border-radius: 50%;
            background: ${primaryColor};
            border: 2px solid ${isSelected ? "#ffffff" : "#111111"};
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
            z-index: 2;
          "></div>

          <!-- Label Box: Facility Name & Days Cover -->
          <div style="
            margin-top: 4px;
            background: rgba(10, 10, 10, 0.9);
            backdrop-filter: blur(4px);
            border: 1px solid ${isSelected ? "#ffffff" : "#2a2a2a"};
            border-radius: 5px;
            padding: 2.5px 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
            white-space: nowrap;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: auto;
            transition: transform 0.15s ease;
          ">
            <span style="
              font-family: monospace;
              font-size: 11px;
              font-weight: 700;
              color: ${isSelected ? "#ffffff" : "#ededed"};
              letter-spacing: -0.01em;
            ">
              ${facility.name.replace("Community Health Center", "CHC").replace("Primary Health Center", "PHC").replace("Sub-District Hospital", "SDH")}
            </span>
            <div style="display: flex; align-items: center; gap: 4px; margin-top: 1px;">
              <span style="
                font-family: monospace;
                font-size: 9.5px;
                font-weight: 700;
                color: ${primaryColor};
                background: ${badgeBg};
                border: 1px solid ${badgeBorder};
                border-radius: 3px;
                padding: 0.5px 4px;
              ">
                ${statusText}
              </span>
              <span style="
                font-family: monospace;
                font-size: 9px;
                color: #888888;
              ">
                ${Math.round(state.dynamicRiskProbability * 100)}% risk
              </span>
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-facility-marker",
        html,
        iconSize: [140, 50],
        iconAnchor: [70, dotSize / 2],
      });

      const marker = L.marker([facility.latitude, facility.longitude], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : isCritical ? 500 : 100,
      });

      // Hover Tooltip
      marker.bindTooltip(
        `
        <div style="font-family: monospace; padding: 4px; font-size: 11px;">
          <div style="font-weight: bold; color: #ffffff; border-bottom: 1px solid #333; padding-bottom: 3px; margin-bottom: 3px;">
            ${facility.name} (${facility.tier})
          </div>
          <div><span style="color:#888;">Type:</span> ${facility.facilityType} &bull; ${facility.district}</div>
          <div><span style="color:#888;">Stock:</span> ${state.currentStockAtDay} units</div>
          <div><span style="color:#888;">Days Cover:</span> <b style="color:${primaryColor};">${state.effectiveDaysCover} days</b></div>
          <div><span style="color:#888;">Stockout Risk:</span> <b style="color:${primaryColor};">${Math.round(state.dynamicRiskProbability * 100)}%</b></div>
          <div style="color: #bbb; margin-top: 3px; font-size: 10px;">${state.inventory.riskDriver}</div>
        </div>
        `,
        {
          className: "osm-custom-tooltip",
          direction: "top",
          offset: [0, -10],
        }
      );

      // Click to select facility
      marker.on("click", () => {
        onSelectFacility(facility.id);
      });

      markersGroup.addLayer(marker);
    });
  }, [facilityStates, referralLinks, selectedFacilityId, cascadeActiveLinks]);

  // Zoom / Pan handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && bounds && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  };

  return (
    <div className="flex flex-col h-full bg-black border border-[#222222] rounded-xl overflow-hidden shadow-sm">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-1.5 border-b border-[#222222] bg-[#0a0a0a] shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <MapIcon className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm uppercase tracking-wider font-mono block">
                Healthcare Facility Network
              </span>
              {/* <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 font-mono">
                OSM Live
              </span> */}
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              Real geographic coordinates &bull; {facilityStates.length} monitoring sites &bull; Hold &amp; drag to pan
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-mono text-neutral-300 mr-1 border-r border-[#262626] pr-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Critical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Warning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Stable
            </span>
          </div>

          {/* Zoom Actions */}
          <div className="flex items-center gap-0.5 bg-black border border-[#262626] rounded-lg p-0.5">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 hover:bg-[#1a1a1a] text-neutral-300 hover:text-white rounded transition-colors"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 hover:bg-[#1a1a1a] text-neutral-300 hover:text-white rounded transition-colors"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              title="Reset View to Bounds"
              className="p-1 hover:bg-[#1a1a1a] text-neutral-300 hover:text-white rounded transition-colors"
              aria-label="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Leaflet Container */}
      <div className="relative flex-1 bg-[#0a0a0a] min-h-0 w-full overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>

      {/* Map Footer Bar */}
      <div className="px-3.5 py-1.5 border-t border-[#222222] bg-[#0a0a0a] flex items-center justify-between text-[11px] text-neutral-400 font-mono shrink-0 z-10">
        <span className="flex items-center gap-1.5">
          <span>Click any facility node to select &bull; Hold &amp; drag map to pan &bull; Scroll to zoom</span>
        </span>
        <span className="text-neutral-500 hidden sm:inline">OpenStreetMap Geographic Projection</span>
      </div>
    </div>
  );
}
