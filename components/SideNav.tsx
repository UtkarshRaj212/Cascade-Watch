"use client";

import React from "react";
import {
  Activity,
  X,
  LayoutDashboard,
  Network,
  Waves,
  TrendingDown,
  ShieldAlert,
  Building2,
  Database,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export type DashboardSection = "all" | "overview" | "network-map" | "cascade-intel" | "trajectory" | "alerts-inspector";

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  selectedDistrict: string;
  selectedDrugName: string;
  horizonDays: number;
  totalFacilitiesCount: number;
  criticalCount: number;
}

export function SideNav({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  selectedDistrict,
  selectedDrugName,
  horizonDays,
  totalFacilitiesCount,
  criticalCount,
}: SideNavProps) {
  const navItems = [
    {
      id: "all" as DashboardSection,
      label: "Complete Dashboard",
      description: "Full unified command view",
      icon: LayoutDashboard,
    },
    {
      id: "overview" as DashboardSection,
      label: "1. Macro Overview & KPIs",
      description: "Executive district summary metrics",
      icon: Activity,
    },
    {
      id: "network-map" as DashboardSection,
      label: "2. Network & Referral Map",
      description: "Spatial nodes & transfer pathways",
      icon: Network,
    },
    {
      id: "cascade-intel" as DashboardSection,
      label: "3. Cascade & Spillover Intel",
      description: "Day-by-day ripple simulation",
      icon: Waves,
    },
    {
      id: "trajectory" as DashboardSection,
      label: "4. Inventory Trajectory",
      description: "Stock depletion & delivery milestones",
      icon: TrendingDown,
    },
    {
      id: "alerts-inspector" as DashboardSection,
      label: "5. Risk Alerts & Deep Dive",
      description: "Ranked priorities & diagnostic audit",
      icon: ShieldAlert,
    },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 transition-opacity duration-200"
          aria-label="Close sidebar backdrop"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#050505] border-r border-[#222222] z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#222222] flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm">
              ▲
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block font-mono">
                CascadeWatch
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                Supply Chain Intelligence
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-[#1f1f1f] transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Context Card */}
        <div className="p-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
          <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono font-semibold block mb-2">
            Active Parameters
          </span>
          <div className="space-y-1.5 text-xs font-mono text-neutral-300">
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">District:</span>
              <span className="font-medium text-white">{selectedDistrict === "all" ? "All Districts" : `${selectedDistrict} District`}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Drug:</span>
              <span className="font-medium text-white truncate max-w-[150px]">{selectedDrugName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Window:</span>
              <span className="font-medium text-white">{horizonDays} Days</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[#1a1a1a]">
              <span className="text-neutral-500">Facilities Monitored:</span>
              <span className="font-semibold text-white">{totalFacilitiesCount} centers</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Critical Status:</span>
              <span className={`font-semibold ${criticalCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {criticalCount} Critical
              </span>
            </div>
          </div>
        </div>

        {/* Section Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
            Dashboard Sections
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all ${
                  isActive
                    ? "bg-[#171717] text-white border border-[#333333] shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-[#0e0e0e] border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-white" : "text-neutral-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold font-mono flex items-center justify-between">
                    <span className={isActive ? "text-white" : "text-neutral-200"}>{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* System & Architecture Footer */}
        <div className="p-4 border-t border-[#1f1f1f] bg-black text-[11px] font-mono space-y-2">
          <div className="flex items-center gap-2 text-neutral-400">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>PostgreSQL &bull; Drizzle ORM</span>
          </div>
          <p className="text-[10px] text-neutral-500 leading-relaxed">
            Deterministic supply-chain network flow simulation for hospital referral cascades.
          </p>
        </div>
      </aside>
    </>
  );
}
