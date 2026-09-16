"use client";

import React from "react";
import { SideNav } from "./SideNav";
import { DashboardHeader } from "./DashboardHeader";

export function DashboardAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-[#ededed] font-sans selection:bg-white selection:text-black">
      {/* Side Navigation Drawer */}
      <SideNav />

      {/* Global Dashboard Header */}
      <DashboardHeader />

      {/* Main Page Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
