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
import { Box, Hammer, LayoutTemplate, Home, Compass, Cpu } from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function App() {
  return (
    <div className="flex h-screen w-full bg-studio-bg overflow-hidden selection:bg-studio-accent/30 selection:text-studio-accent">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 grid grid-cols-3 grid-rows-2 gap-[1px] bg-studio-grid overflow-hidden">
          <FabricationPanel 
            id_num="01"
            title="CAD ENGINEERING" 
            filename="Chassis_Parametric_V2.step"
            icon={Compass}
            accentColor="text-blue-400"
            accentBg="bg-blue-900/20 border-blue-500/30"
            actionText="ENGINEERING PLAN"
          >
            <CADViewport />
          </FabricationPanel>

          <FabricationPanel 
            id_num="02"
            title="3D PRECISION MESH" 
            filename="Mesh_Gear_V9.stl"
            icon={Box}
            accentColor="text-3d-accent"
            accentBg="bg-blue-900/20 border-blue-500/30"
            actionText="Export for Slicers (STL/OBJ)"
          >
            <ThreeDPrintingViewport />
          </FabricationPanel>

          <FabricationPanel 
            id_num="03"
            title="PRECISION CNC ROUTER" 
            filename="Machining_Gcode_V1.nc"
            icon={Hammer}
            accentColor="text-wood-accent"
            accentBg="bg-amber-900/20 border-amber-500/30"
            actionText="GENERATE G-CODE"
          >
            <CNCRouterViewport />
          </FabricationPanel>

          <FabricationPanel 
            id_num="04"
            title="DIE-CUT TEMPLATES" 
            filename="HexBox_250gsm.plt"
            icon={LayoutTemplate}
            accentColor="text-pack-accent"
            accentBg="bg-emerald-900/20 border-emerald-500/30"
            actionText="Print & Cut Markers"
          >
            <PackagingViewport />
          </FabricationPanel>

          <FabricationPanel 
            id_num="05"
            title="ELECTRONICS & PCB" 
            filename="Logic_Board_A.brd"
            icon={Cpu}
            accentColor="text-pack-accent"
            accentBg="bg-emerald-900/20 border-emerald-500/30"
            actionText="PCB AUDIT"
          >
            <CircuitViewport />
          </FabricationPanel>

          <FabricationPanel 
            id_num="06"
            title="BIM ARCHITECTURE" 
            filename="House_Parametric_V4.rvt"
            icon={Home}
            accentColor="text-orange-500"
            accentBg="bg-orange-900/20 border-orange-500/30"
            actionText="Extract Parts"
          >
            <BIMViewport />
          </FabricationPanel>
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
