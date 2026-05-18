/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { FabricationPanel } from "./components/FabricationPanel";
import { TerminalOverlay } from "./components/TerminalOverlay";
import { AIChatPanel } from "./components/AIChatPanel";
import { SystemHealthMonitor } from "./components/SystemHealthMonitor";
import { ThreeDPrintingViewport } from "./components/Viewports/3DPrintingViewport";
import { CNCRouterViewport } from "./components/Viewports/CNCRouterViewport";
import { PackagingViewport } from "./components/Viewports/PackagingViewport";
import { BIMViewport } from "./components/Viewports/BIMViewport";
import { CADViewport } from "./components/Viewports/CADViewport";
import { CircuitViewport } from "./components/Viewports/CircuitViewport";
import { PBRTexturingViewport } from "./components/Viewports/PBRTexturingViewport";
import { TinkercadViewport } from "./components/Viewports/TinkercadViewport";
import { OpenSCADViewport } from "./components/Viewports/OpenSCADViewport";
import { HYWorldViewport } from "./components/Viewports/HYWorldViewport";
import { PhotogrammetryViewport } from "./components/Viewports/PhotogrammetryViewport";
import { Box, Hammer, LayoutTemplate, Home, Compass, Cpu, Palette, Zap, CodeSquare, Globe, ChevronRight, Camera } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useI18n } from "./lib/i18n";

const toolsConfig = [
  { id: "cad", titleKey: "panel.cad.title", icon: Compass, component: CADViewport, color: "text-blue-400", bg: "bg-blue-900/20 border-blue-500/30", actionKey: "panel.cad.action", file: "Chassis_Parametric_V2.step", id_num: "01", fallbackTitle: "CAD EDITOR" },
  { id: "3d", titleKey: "panel.3d.title", icon: Box, component: ThreeDPrintingViewport, color: "text-3d-accent", bg: "bg-blue-900/20 border-blue-500/30", actionKey: "panel.3d.action", file: "Mesh_Gear_V9.stl", id_num: "02", fallbackTitle: "3D PRINTING" },
  { id: "cnc", titleKey: "panel.cnc.title", icon: Hammer, component: CNCRouterViewport, color: "text-wood-accent", bg: "bg-amber-900/20 border-amber-500/30", actionKey: "panel.cnc.action", file: "Machining_Gcode_V1.nc", id_num: "03", fallbackTitle: "CNC ROUTER" },
  { id: "pkg", titleKey: "panel.pkg.title", icon: LayoutTemplate, component: PackagingViewport, color: "text-pack-accent", bg: "bg-emerald-900/20 border-emerald-500/30", actionKey: "panel.pkg.action", file: "HexBox_250gsm.plt", id_num: "04", fallbackTitle: "PACKAGING" },
  { id: "pcb", titleKey: "panel.pcb.title", icon: Cpu, component: CircuitViewport, color: "text-pack-accent", bg: "bg-emerald-900/20 border-emerald-500/30", actionKey: "panel.pcb.action", file: "Logic_Board_A.brd", id_num: "05", fallbackTitle: "PCB DESIGN" },
  { id: "bim", titleKey: "panel.bim.title", icon: Home, component: BIMViewport, color: "text-orange-500", bg: "bg-orange-900/20 border-orange-500/30", actionKey: "panel.bim.action", file: "House_Parametric_V4.rvt", id_num: "06", fallbackTitle: "BIM VIEWER" },
  { id: "pbr", titleKey: "panel.pbr.title", icon: Palette, component: PBRTexturingViewport, color: "text-purple-400", bg: "bg-purple-900/20 border-purple-500/30", actionKey: "panel.pbr.action", file: "Material_Library_V2.sbsar", id_num: "07", fallbackTitle: "PBR TEXTURING", fallbackAction: "APPLY MATERIAL" },
  { id: "tinker", titleKey: "panel.tinker.title", icon: Zap, component: TinkercadViewport, color: "text-cyan-400", bg: "bg-cyan-900/20 border-cyan-500/30", actionKey: "panel.tinker.action", file: "IoT_Controller.ino", id_num: "08", fallbackTitle: "ELECTRONICS SIM", fallbackAction: "UPLOAD FIRMWARE" },
  { id: "openscad", titleKey: "panel.openscad.title", icon: CodeSquare, component: OpenSCADViewport, color: "text-yellow-500", bg: "bg-yellow-900/20 border-yellow-500/30", actionKey: "panel.openscad.action", file: "Parametric_Bracket.scad", id_num: "09", fallbackTitle: "SCRIPTING CAD", fallbackAction: "RENDER SCRIPT" },
  { id: "hyworld", titleKey: "panel.hyworld.title", icon: Globe, component: HYWorldViewport, color: "text-pink-500", bg: "bg-pink-900/20 border-pink-500/30", actionKey: "panel.hyworld.action", file: "HY_WorldMirror_Model.pkl", id_num: "10", fallbackTitle: "AI 3D WORLD GEN", fallbackAction: "SYNTHESIZE" },
  { id: "photo", titleKey: "photo.title", icon: Camera, component: PhotogrammetryViewport, color: "text-blue-400", bg: "bg-blue-900/20 border-blue-500/30", actionKey: "photo.title", file: "Sparse_Cloud.abc", id_num: "11", fallbackTitle: "PHOTOGRAMMETRY", fallbackAction: "RECONSTRUCT" }
];

export default function App() {
  const { t } = useI18n();
  const [activeToolId, setActiveToolId] = useState(toolsConfig[0].id);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const activeTool = toolsConfig.find(t => t.id === activeToolId) || toolsConfig[0];
  const ActiveComponent = activeTool.component;

  return (
    <div className="flex h-screen w-full bg-studio-bg overflow-hidden selection:bg-studio-accent/30 selection:text-studio-accent font-mono">
      <Sidebar />
      <TerminalOverlay />
      <AIChatPanel isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenAI={() => setIsAIChatOpen(true)} />
        
        <main className="flex-1 flex overflow-hidden bg-studio-grid">
          {/* Internal Explorer Sidebar */}
          <div className="w-56 shrink-0 bg-[#0a0a0b] border-r border-white/5 flex flex-col pt-3">
             <div className="px-4 pb-2 mb-2 border-b border-white/5 text-[9px] uppercase font-black tracking-widest text-white/40">
                Workspaces
             </div>
             <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
               {toolsConfig.map((tool) => {
                 const isActive = activeToolId === tool.id;
                 const Icon = tool.icon;
                 return (
                   <button
                     key={tool.id}
                     onClick={() => setActiveToolId(tool.id)}
                     className={cn(
                       "w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase font-bold rounded transition-all",
                       isActive ? "bg-white/10 text-white cursor-default" : "text-white/40 hover:bg-white/5 hover:text-white/80 cursor-pointer"
                     )}
                   >
                     <div className="flex items-center gap-2.5">
                        <Icon className={cn("w-3.5 h-3.5", isActive ? tool.color : "opacity-50")} />
                        <span className="truncate">{t(tool.titleKey) || tool.fallbackTitle}</span>
                     </div>
                     {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                   </button>
                 );
               })}
             </div>
             <div className="p-2 border-t border-white/5 bg-black/20">
               <SystemHealthMonitor />
             </div>
          </div>

          <div className="flex-1 grid grid-cols-1 auto-rows-[minmax(300px,1fr)] min-h-full p-2 h-full overflow-hidden">
            <FabricationPanel 
              id_num={activeTool.id_num}
              title={t(activeTool.titleKey) || activeTool.fallbackTitle} 
              filename={activeTool.file}
              icon={activeTool.icon}
              accentColor={activeTool.color}
              accentBg={activeTool.bg}
              actionText={t(activeTool.actionKey) || activeTool.fallbackAction || "EXECUTE"}
              className="h-full"
            >
              <ActiveComponent />
            </FabricationPanel>
          </div>
        </main>

        {/* Footer Status Bar */}
        <footer className="h-8 bg-studio-panel border-t border-studio-border flex items-center justify-between px-4 shrink-0 text-[9px] font-mono tracking-wider text-white/40">
          <div className="flex gap-6">
            <PerformanceMetric label="RAM" value={12.4} max={64} unit="MB" color="text-3d-accent" api="/api/system/stats" />
            <PerformanceMetric label="CPU" value={82} max={100} unit="%" color="text-wood-accent" api="/api/system/stats" />
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

function PerformanceMetric({ label, value: defaultValue, max, unit, color, api }: { label: string, value: number, max: number, unit: string, color: string, api?: string }) {
  const [currentValue, setCurrentValue] = useState(defaultValue);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (api) {
        try {
          const res = await fetch(api);
          const data = await res.json();
          // Map backend stats to labels
          if (label === "RAM") setCurrentValue(parseFloat(data.rss));
          if (label === "CPU") setCurrentValue(Math.min(100, (parseFloat(data.uptime) / 3600) * 100)); // Simulated derived load
        } catch (e) {
          // Fallback to random jitter if API fails
          const jitter = (Math.random() - 0.5) * (defaultValue * 0.05);
          setCurrentValue(Math.min(max, Math.max(0, defaultValue + jitter)));
        }
      } else {
        const jitter = (Math.random() - 0.5) * (defaultValue * 0.05);
        setCurrentValue(Math.min(max, Math.max(0, defaultValue + jitter)));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [defaultValue, max, api, label]);

  return (
    <div className="flex gap-2 items-center">
      <span className={cn("font-bold", color)}>{label}:</span> 
      {currentValue.toFixed(1)}{unit} / {max}{unit}
    </div>
  );
}
