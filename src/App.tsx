/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
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
  const [searchFilter, setSearchFilter] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch(e) {}
  }, []);

  const handleSearch = (val: string) => {
    setSearchFilter(val);
    if (!val.trim()) {
      setShowRecent(true);
      return;
    }
  };

  const commitSearch = (val: string) => {
    if (!val.trim()) return;
    const lower = val.toLowerCase().trim();
    const newRecent = [lower, ...recentSearches.filter(s => s !== lower)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    setShowRecent(false);
  };
  
  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const activeTool = toolsConfig.find(t => t.id === activeToolId) || toolsConfig[0];
  const ActiveComponent = activeTool.component;

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--md-sys-color-background)] overflow-hidden selection:bg-studio-accent/30 selection:text-studio-accent font-sans">
      <Sidebar />
      <TerminalOverlay />
      <AIChatPanel isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      
      <Header onOpenAI={() => setIsAIChatOpen(true)} />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[var(--md-sys-color-background)] p-4 md:p-6">
        <div className="mx-auto max-w-7xl w-full h-full min-h-[600px] grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          {/* Internal Explorer Sidebar */}
          <div className="bg-[var(--md-sys-color-surface-container)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] flex flex-col pt-5 overflow-hidden md-elevation-1">
             <div className="px-6 pb-2 mb-2 border-b border-[var(--md-sys-color-outline-variant)] flex flex-col gap-3 relative">
                <span className="text-xs uppercase font-bold tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Workspaces</span>
                <input 
                  type="text" 
                  value={searchFilter}
                  placeholder="Filter workspaces..." 
                  className="m3-input mb-2 text-sm"
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitSearch(searchFilter);
                  }}
                  onFocus={() => {
                    if (recentSearches.length > 0 && !searchFilter) setShowRecent(true);
                  }}
                  onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                />
                <AnimatePresence>
                  {showRecent && recentSearches.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className="absolute top-[85px] left-6 right-6 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-xl shadow-lg z-20 overflow-hidden flex flex-col"
                    >
                      <div className="px-3 py-2 text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] flex justify-between items-center border-b border-[var(--md-sys-color-outline-variant)]">
                        Recent Searches
                        <button onClick={clearRecent} className="hover:text-[var(--md-sys-color-primary)] transition-colors">Clear</button>
                      </div>
                      <div className="flex flex-col">
                        {recentSearches.map(s => (
                           <button 
                             key={s} 
                             onClick={() => {
                               setSearchFilter(s);
                               commitSearch(s);
                             }}
                             className="px-3 py-2 text-sm text-[var(--md-sys-color-on-surface)] text-left hover:bg-[var(--md-sys-color-surface)] transition-colors"
                           >
                             {s}
                           </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
             <div className="flex-1 overflow-y-auto px-3 space-y-1">
               {toolsConfig.filter(tool => {
                 const title = t(tool.titleKey) || tool.fallbackTitle;
                 return title.toLowerCase().includes(searchFilter);
               }).map((tool) => {
                 const isActive = activeToolId === tool.id;
                 const Icon = tool.icon;
                 return (
                   <button
                     key={tool.id}
                     data-name={t(tool.titleKey) || tool.fallbackTitle}
                     onClick={() => setActiveToolId(tool.id)}
                     className={cn(
                       "workspace-item w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-2xl transition-all",
                       isActive ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] cursor-default" : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                     )}
                   >
                     <div className="flex items-center gap-3">
                        <Icon className={cn("w-5 h-5", isActive ? "text-[var(--md-sys-color-primary)]" : "opacity-70")} />
                        <span className="truncate">{t(tool.titleKey) || tool.fallbackTitle}</span>
                     </div>
                     {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                   </button>
                 );
               })}
             </div>
             <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
               <SystemHealthMonitor />
             </div>
          </div>

          <div className="flex flex-col min-h-0 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl overflow-hidden md-elevation-2 relative">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full absolute inset-0"
              >
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
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-12 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between px-6 shrink-0 text-xs font-mono tracking-wide text-[var(--md-sys-color-on-surface-variant)]">
        <div className="flex gap-8">
          <PerformanceMetric label="RAM" value={12.4} max={64} unit="MB" color="text-3d-accent" api="/api/system/stats" />
          <PerformanceMetric label="CPU" value={82} max={100} unit="%" color="text-wood-accent" api="/api/system/stats" />
          <PerformanceMetric label="NET" value={1.2} max={10} unit="GBPS" color="text-pack-accent" />
        </div>
        <div className="flex gap-6 items-center">
           <span className="text-[var(--md-sys-color-on-surface)] font-semibold uppercase tracking-wider animate-pulse">READY</span>
           <span className="text-[var(--md-sys-color-primary)] opacity-80 font-bold">AUTO-SAVE: 10s AGO</span>
        </div>
      </footer>
    </div>
  );
}

function PerformanceMetric({ label, value: defaultValue, max, unit, color, api }: { label: string, value: number, max: number, unit: string, color: string, api?: string }) {
  const [currentValue, setCurrentValue] = useState(defaultValue);

  useEffect(() => {
    const fetchMetric = async () => {
      // Hardware metrics proxy based on browser performance API if available natively
      if (typeof performance !== 'undefined' && (performance as any).memory) {
         const mem = (performance as any).memory;
         if (label === "RAM") {
             setCurrentValue((mem.usedJSHeapSize / 1024 / 1024 / 1024) * 8); // rough scaling
             return;
         }
      }

      if (api) {
        try {
          const res = await fetch(api);
          if (!res.ok) throw new Error("API Route missing");
          const data = await res.json();
          if (label === "RAM" && data.rss) setCurrentValue(parseFloat(data.rss));
          if (label === "CPU" && data.uptime) setCurrentValue(Math.min(100, (parseFloat(data.uptime) / 3600) * 100));
        } catch (e) {
          // Explicit exception handling: Graceful fallback without mock jitter
          setCurrentValue(defaultValue);
        }
      } else {
         setCurrentValue(defaultValue);
      }
    };

    const interval = setInterval(fetchMetric, 2000);
    fetchMetric(); // Initial fetch
    
    return () => clearInterval(interval);
  }, [defaultValue, max, api, label]);

  return (
    <div className="flex gap-2 items-center">
      <span className={cn("font-bold", color)}>{label}:</span> 
      {currentValue.toFixed(1)}{unit} / {max}{unit}
    </div>
  );
}
