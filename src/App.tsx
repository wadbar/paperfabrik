/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { FabricationPanel } from "./components/FabricationPanel";
import { ThreeDPrintingViewport } from "./components/Viewports/3DPrintingViewport";
import { CNCRouterViewport } from "./components/Viewports/CNCRouterViewport";
import { PackagingViewport } from "./components/Viewports/PackagingViewport";
import { BIMViewport } from "./components/Viewports/BIMViewport";
import { CADViewport } from "./components/Viewports/CADViewport";
import { CircuitViewport } from "./components/Viewports/CircuitViewport";
import { PBRTexturingViewport } from "./components/Viewports/PBRTexturingViewport";
import { TinkercadViewport } from "./components/Viewports/TinkercadViewport";
import { OpenSCADViewport } from "./components/Viewports/OpenSCADViewport";
import { Box, Hammer, LayoutTemplate, Home, Compass, Cpu, Palette, Zap, CodeSquare } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useI18n } from "./lib/i18n";

export default function App() {
  const { t } = useI18n();

  return (
    <div className="flex h-screen w-full bg-studio-bg overflow-hidden selection:bg-studio-accent/30 selection:text-studio-accent">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-[minmax(300px,1fr)] xl:auto-rows-[minmax(380px,1fr)] gap-[1px] bg-studio-grid min-h-full">
            <FabricationPanel 
              id_num="01"
              title={t("panel.cad.title")} 
              filename="Chassis_Parametric_V2.step"
              icon={Compass}
              accentColor="text-blue-400"
              accentBg="bg-blue-900/20 border-blue-500/30"
              actionText={t("panel.cad.action")}
            >
              <CADViewport />
            </FabricationPanel>

            <FabricationPanel 
              id_num="02"
              title={t("panel.3d.title")} 
              filename="Mesh_Gear_V9.stl"
              icon={Box}
              accentColor="text-3d-accent"
              accentBg="bg-blue-900/20 border-blue-500/30"
              actionText={t("panel.3d.action")}
            >
              <ThreeDPrintingViewport />
            </FabricationPanel>

            <FabricationPanel 
              id_num="03"
              title={t("panel.cnc.title")} 
              filename="Machining_Gcode_V1.nc"
              icon={Hammer}
              accentColor="text-wood-accent"
              accentBg="bg-amber-900/20 border-amber-500/30"
              actionText={t("panel.cnc.action")}
            >
              <CNCRouterViewport />
            </FabricationPanel>

            <FabricationPanel 
              id_num="04"
              title={t("panel.pkg.title")} 
              filename="HexBox_250gsm.plt"
              icon={LayoutTemplate}
              accentColor="text-pack-accent"
              accentBg="bg-emerald-900/20 border-emerald-500/30"
              actionText={t("panel.pkg.action")}
            >
              <PackagingViewport />
            </FabricationPanel>

            <FabricationPanel 
              id_num="05"
              title={t("panel.pcb.title")} 
              filename="Logic_Board_A.brd"
              icon={Cpu}
              accentColor="text-pack-accent"
              accentBg="bg-emerald-900/20 border-emerald-500/30"
              actionText={t("panel.pcb.action")}
            >
              <CircuitViewport />
            </FabricationPanel>

            <FabricationPanel 
              id_num="06"
              title={t("panel.bim.title")} 
              filename="House_Parametric_V4.rvt"
              icon={Home}
              accentColor="text-orange-500"
              accentBg="bg-orange-900/20 border-orange-500/30"
              actionText={t("panel.bim.action")}
            >
              <BIMViewport />
            </FabricationPanel>

            <FabricationPanel 
              id_num="07"
              title={t("panel.pbr.title") || "PBR TEXTURING"} 
              filename="Material_Library_V2.sbsar"
              icon={Palette}
              accentColor="text-purple-400"
              accentBg="bg-purple-900/20 border-purple-500/30"
              actionText={t("panel.pbr.action") || "APPLY MATERIAL"}
            >
              <PBRTexturingViewport />
            </FabricationPanel>

            <FabricationPanel 
              id_num="08"
              title={t("panel.tinker.title") || "ELECTRONICS SIM"} 
              filename="IoT_Controller.ino"
              icon={Zap}
              accentColor="text-cyan-400"
              accentBg="bg-cyan-900/20 border-cyan-500/30"
              actionText={t("panel.tinker.action") || "UPLOAD FIRMWARE"}
            >
              <TinkercadViewport />
            </FabricationPanel>

            <FabricationPanel 
              id_num="09"
              title={t("panel.openscad.title") || "SCRIPTING CAD"} 
              filename="Parametric_Bracket.scad"
              icon={CodeSquare}
              accentColor="text-yellow-500"
              accentBg="bg-yellow-900/20 border-yellow-500/30"
              actionText={t("panel.openscad.action") || "RENDER SCRIPT"}
              className="xl:col-span-2"
            >
              <OpenSCADViewport />
            </FabricationPanel>
          </div>
        </main>

        {/* Footer Status Bar */}
        <footer className="h-8 bg-studio-panel border-t border-studio-border flex items-center justify-between px-4 shrink-0 text-[9px] font-mono tracking-wider text-white/40">
          <div className="flex gap-6">
            <PerformanceMetric label="RAM" value={12.4} max={64} unit="GB" color="text-3d-accent" />
            <PerformanceMetric label="GPU" value={82} max={100} unit="%" color="text-wood-accent" />
            <PerformanceMetric label="NET" value={1.2} max={10} unit="GBPS" color="text-pack-accent" />
          </div>
          <div className="flex gap-4">
             <span className="text-white/80 font-bold uppercase tracking-widest animate-pulse">READY FOR FABRICATION</span>
             <span className="text-studio-accent opacity-60">AUTO-SAVE: 10s AGO</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function PerformanceMetric({ label, value, max, unit, color }: { label: string, value: number, max: number, unit: string, color: string }) {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * (value * 0.05);
      setCurrentValue(Math.min(max, Math.max(0, value + jitter)));
    }, 1500);
    return () => clearInterval(interval);
  }, [value, max]);

  return (
    <div className="flex gap-2 items-center">
      <span className={cn("font-bold", color)}>{label}:</span> 
      {currentValue.toFixed(1)}{unit} / {max}{unit}
    </div>
  );
}
