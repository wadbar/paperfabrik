/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Cpu, Zap, Activity, Info, Download, Layers, Eye, EyeOff } from "lucide-react";
import { useI18n } from "../../lib/i18n";

const COMPONENT_DETAILS: Record<string, any> = {
  'U1': {
    name: 'STM32F411CEU6',
    desc: ['ARM Cortex-M4 32b MCU+FPU', '100 MHz max, 512 KB Flash, 128 KB SRAM', 'Package: UFQFPN48'],
    specs: { 'VDD': '1.7V - 3.6V', 'I/O': '36', 'ADC': '1x12-bit', 'Timers': '8' }
  },
  'R1': {
    name: '10kΩ Resistor',
    desc: ['Thick Film Resistor', 'Tolerance: ±1%', 'Power: 0.063W', 'Package: 0402'],
    specs: { 'Value': '10kΩ', 'Tol': '1%', 'Temp': '±100ppm/°C', 'Rating': '1/16W' }
  },
  'C1': {
    name: '100nF Capacitor',
    desc: ['Multilayer Ceramic Capacitor (MLCC)', 'Dielectric: X7R', 'Voltage: 16V', 'Package: 0402'],
    specs: { 'Cap': '100nF', 'Vol': '16V', 'Range': '-55°C to 125°C', 'Tol': '±10%' }
  },
  'L1': {
    name: 'Blue LED',
    desc: ['SMD LED Blue 470nm', 'Lens: clear', 'Luminous: 150mcd', 'Package: 0603'],
    specs: { 'Vf': '3.1V', 'If': '20mA', 'Color': 'Blue', 'Angle': '120°' }
  },
  'OSC1': {
    name: '16MHz Crystal',
    desc: ['Quartz Crystal', 'Load Cap: 10pF', 'Tolerance: ±20ppm', 'Package: 3.2x2.5mm'],
    specs: { 'Freq': '16MHz', 'CL': '10pF', 'ESR': '60Ω', 'Drive': '100µW' }
  }
};

export function CircuitViewport() {
  const { t } = useI18n();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'top' | 'bottom' | 'silkscreen'>('top');
  const [telemetry, setTelemetry] = useState({ load: 12, ram: 45, connection: 'SYNCED', faults: 0 });
  const [generateLog, setGenerateLog] = useState<string | null>(null);
  const [visibleLayers, setVisibleLayers] = useState({ top: true, bottom: true, silkscreen: true });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        load: Math.max(0, Math.min(100, prev.load + (Math.random() * 20 - 10))),
        ram: Math.max(0, Math.min(100, prev.ram + (Math.random() * 5 - 2.5))),
        connection: Math.random() > 0.05 ? 'SYNCED' : 'DROP',
        faults: prev.connection === 'DROP' ? prev.faults + 1 : prev.faults
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateGerber = () => {
    setGenerateLog("Generating Gerber files...");
    setTimeout(() => {
        const content = "GERBER_DATA_MOCK\nG04 Layer: " + activeLayer + "*\nG01*\nX100Y100D02*\nX200Y200D01*\nM02*";
        const blob = new Blob([content], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pcb_export_${activeLayer}_${Date.now()}.gbr`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setGenerateLog("Gerber export successful!");
        setTimeout(() => setGenerateLog(null), 3000);
    }, 1000);
  };

  const pcbTheme = {
    top: { trace: "text-emerald-500/80", bg: "bg-[#0a2010]/20", border: 'borderColor-emerald-500 border-emerald-500/30', grid: "#10b981", activeBg: "bg-emerald-500/20" },
    bottom: { trace: "text-blue-500/80", bg: "bg-[#0a1020]/20", border: 'borderColor-blue-500 border-blue-500/30', grid: "#3b82f6", activeBg: "bg-blue-500/20" },
    silkscreen: { trace: "text-zinc-300/80", bg: "bg-[#1a1a1a]/20", border: 'borderColor-zinc-400 border-zinc-400/30', grid: "#d4d4d8", activeBg: "bg-zinc-100/20" }
  };

  const currentTheme = pcbTheme[activeLayer];

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-emerald-500/30">
      <div className="flex-1 bg-[#050505] rounded border border-white/5 relative p-4 flex gap-4 min-h-0 overflow-hidden">
        {/* PCB Canvas */}
        <div className={`flex-1 border-2 rounded-sm relative transition-colors ${currentTheme.bg} ${currentTheme.border} overflow-hidden`}>
          {/* Copper Traces Background */}
          <div className="absolute inset-0 opacity-[0.03] transition-colors" style={{ backgroundImage: `linear-gradient(${currentTheme.grid} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.grid} 1px, transparent 1px)`, backgroundSize: '10px 10px' }} />
          
          <svg className="w-full h-full transition-colors" viewBox="0 0 100 100">
            {/* Bottom PCB Traces */}
            {visibleLayers.bottom && (
               <g fill="none" stroke="currentColor" strokeWidth="0.8" className={`transition-colors ${activeLayer === 'bottom' ? 'text-blue-400' : 'text-blue-500/40'}`}>
                 <motion.path 
                   d="M 10 20 L 30 20 L 30 50 L 70 50" 
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 1 }}
                   transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                 />
                 <path d="M 80 80 L 80 60 L 50 60" />
               </g>
            )}

            {/* Top PCB Traces & Vias */}
            {visibleLayers.top && (
               <g className={`transition-colors ${activeLayer === 'top' ? 'text-emerald-400' : 'text-emerald-500/40'}`}>
                 <g fill="none" stroke="currentColor" strokeWidth="0.8">
                   <motion.path 
                     d="M 10 10 L 40 10 L 40 30 L 60 30" 
                     initial={{ pathLength: 0 }}
                     animate={{ pathLength: 1 }}
                     transition={{ duration: 2, repeat: Infinity }}
                   />
                 </g>
                 {/* Vias/Pads */}
                 <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                 <circle cx="10" cy="20" r="1.5" fill="currentColor" />
                 <circle cx="60" cy="30" r="1.5" fill="currentColor" />
                 <circle cx="70" cy="50" r="2" fill="currentColor" />
                 <circle cx="80" cy="80" r="1.5" fill="currentColor" />
               </g>
            )}

            {/* Silkscreen Layer (Components) */}
            {visibleLayers.silkscreen && (
               <g className={`transition-colors ${activeLayer === 'silkscreen' ? 'text-zinc-200' : 'text-zinc-500'}`}>
                 {/* Interactive IC Package (U1) */}
                 <g 
                     className="cursor-pointer transition-all" 
                     onClick={() => setSelectedComponent("U1")}
                 >
                     <rect 
                         x="35" y="45" width="20" height="20" rx="1" 
                         fill={selectedComponent === "U1" ? currentTheme.grid : "#000"} 
                         stroke={selectedComponent === "U1" ? "#fff" : "currentColor"} 
                         strokeWidth={selectedComponent === "U1" ? "1" : "0.5"} 
                     />
                     <text 
                         x="45" y="57" textAnchor="middle" 
                         className={`${selectedComponent === 'U1' ? 'fill-black' : (activeLayer === 'top' ? 'fill-emerald-400' : 'fill-white')} text-[4px] font-bold`}
                      >
                         ARM_M4
                      </text>
                      
                     {/* Highlight Rings when selected */}
                     {selectedComponent === 'U1' && (
                         <motion.rect 
                             x="33" y="43" width="24" height="24" rx="2" 
                             fill="none" stroke="#fff" strokeWidth="0.5" 
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: [1, 0.2, 1], scale: [1, 1.05, 1] }}
                             transition={{ duration: 1.5, repeat: Infinity }}
                         />
                     )}
                 </g>

                 {/* R1 */}
                 <g className="cursor-pointer transition-all" onClick={() => setSelectedComponent("R1")}>
                     <rect x="25" y="25" width="4" height="8" fill={selectedComponent === "R1" ? currentTheme.grid : "#000"} stroke={selectedComponent === "R1" ? "#fff" : "currentColor"} strokeWidth={selectedComponent === "R1" ? "0.8" : "0.5"} />
                     {selectedComponent === 'R1' && (
                         <motion.rect x="23" y="23" width="8" height="12" fill="none" stroke="#fff" strokeWidth="0.5" initial={{ opacity: 0 }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                     )}
                 </g>

                 {/* C1 */}
                 <g className="cursor-pointer transition-all" onClick={() => setSelectedComponent("C1")}>
                     <rect x="65" y="25" width="8" height="4" fill={selectedComponent === "C1" ? currentTheme.grid : "#000"} stroke={selectedComponent === "C1" ? "#fff" : "currentColor"} strokeWidth={selectedComponent === "C1" ? "0.8" : "0.5"} />
                     {selectedComponent === 'C1' && (
                         <motion.rect x="63" y="23" width="12" height="8" fill="none" stroke="#fff" strokeWidth="0.5" initial={{ opacity: 0 }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                     )}
                 </g>

                 {/* L1 */}
                 <g className="cursor-pointer transition-all" onClick={() => setSelectedComponent("L1")}>
                     <rect x="80" y="55" width="6" height="6" fill={selectedComponent === "L1" ? currentTheme.grid : "#000"} stroke={selectedComponent === "L1" ? "#fff" : "currentColor"} strokeWidth={selectedComponent === "L1" ? "0.8" : "0.5"} />
                     {selectedComponent === 'L1' && (
                         <motion.rect x="78" y="53" width="10" height="10" fill="none" stroke="#fff" strokeWidth="0.5" initial={{ opacity: 0 }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                     )}
                 </g>

                 {/* OSC1 */}
                 <g className="cursor-pointer transition-all" onClick={() => setSelectedComponent("OSC1")}>
                     <rect x="20" y="70" width="10" height="8" rx="1" fill={selectedComponent === "OSC1" ? currentTheme.grid : "#000"} stroke={selectedComponent === "OSC1" ? "#fff" : "currentColor"} strokeWidth={selectedComponent === "OSC1" ? "0.8" : "0.5"} />
                     <text x="25" y="75" textAnchor="middle" className="fill-white text-[3px] font-bold">16M</text>
                     {selectedComponent === 'OSC1' && (
                         <motion.rect x="18" y="68" width="14" height="12" rx="2" fill="none" stroke="#fff" strokeWidth="0.5" initial={{ opacity: 0 }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                     )}
                 </g>
               </g>
            )}
          </svg>

          {/* Logic Probe Indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 border border-white/10 p-2 rounded backdrop-blur-sm">
             <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
             <div className="flex flex-col">
               <span className="text-[7px] text-emerald-500 uppercase font-black">{t("pcb.telemetry")}</span>
               <span className="text-[9px] text-white">CLOCK: 48MHz / VCC: 3.3V</span>
             </div>
          </div>

          {/* Enhanced Live Telemetry */}
          <div className="absolute bottom-4 right-4 bg-black/80 border border-white/10 p-3 rounded shadow-lg backdrop-blur-md w-36">
             <div className="flex flex-col gap-1.5">
               <div className="flex justify-between items-center text-[7px] font-bold text-white/70">
                 <span>CPU_LOAD</span>
                 <span className="font-mono text-emerald-400">{telemetry.load.toFixed(1)}%</span>
               </div>
               <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${telemetry.load}%` }} />
               </div>
               
               <div className="flex justify-between items-center text-[7px] font-bold text-white/70 mt-1">
                 <span>MEM_ALLOC</span>
                 <span className="font-mono text-blue-400">{telemetry.ram.toFixed(1)}%</span>
               </div>
               <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${telemetry.ram}%` }} />
               </div>
               
               <div className="mt-1 pt-1 border-t border-white/10 flex justify-between items-center text-[6.5px]">
                  <span className="text-white/40 uppercase">STATUS_LINK</span>
                  <span className={`flex items-center gap-1 font-black animate-pulse ${telemetry.connection === 'SYNCED' ? 'text-emerald-500' : 'text-red-500'}`}>
                     {telemetry.connection === 'SYNCED' ? <Activity className="w-2 h-2" /> : <Zap className="w-2 h-2" />}
                     {telemetry.connection}
                  </span>
               </div>
             </div>
          </div>
          
          {/* Active Layer Watermark */}
          <div className="absolute top-4 right-4 pointer-events-none opacity-20 flex flex-col items-end">
            <Layers className="w-8 h-8 mb-1" />
            <span className="text-xl font-bold uppercase tracking-widest">{activeLayer}</span>
            <span className="text-[8px] uppercase tracking-widest">Active Render Layer</span>
          </div>

          {/* Component Details Panel */}
          {selectedComponent && COMPONENT_DETAILS[selectedComponent] && (
            <div className="absolute top-20 left-4 bg-black/80 border border-white/10 p-3 rounded shadow-lg backdrop-blur-md w-48 z-10 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-bold text-[10px]">{COMPONENT_DETAILS[selectedComponent].name}</span>
                <button onClick={() => setSelectedComponent(null)} className="text-white/50 hover:text-white">&times;</button>
              </div>
              <div className="text-[8px] text-white/70 space-y-1 mb-2">
                {COMPONENT_DETAILS[selectedComponent].desc.map((line: string, i: number) => (
                   <p key={i}>{line}</p>
                ))}
              </div>
              <div className="border-t border-white/10 pt-2 text-[7px] text-white/50">
                 <div className="grid grid-cols-2 gap-1 font-mono">
                    {Object.entries(COMPONENT_DETAILS[selectedComponent].specs).map(([k, v]) => (
                       <div key={k}>{k}: {v as string}</div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {generateLog && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded shadow-lg backdrop-blur-md"
            >
               {generateLog}
            </motion.div>
          )}
        </div>

        {/* BOM / Component Info */}
        <div className="w-40 flex flex-col gap-2 shrink-0">
          <div className="p-2 bg-white/5 rounded border border-white/10">
            <div className="text-[7px] text-white/50 uppercase font-black mb-1">Active Layer Control</div>
            <div className="flex bg-black/50 p-0.5 rounded gap-0.5 mb-2">
               <button onClick={() => setActiveLayer('top')} className={`flex-1 py-1 text-[7px] rounded uppercase font-bold transition-colors ${activeLayer === 'top' ? 'bg-emerald-600 text-white' : 'text-white/40 hover:bg-white/10'}`}>TOP</button>
               <button onClick={() => setActiveLayer('bottom')} className={`flex-1 py-1 text-[7px] rounded uppercase font-bold transition-colors ${activeLayer === 'bottom' ? 'bg-blue-600 text-white' : 'text-white/40 hover:bg-white/10'}`}>BOT</button>
               <button onClick={() => setActiveLayer('silkscreen')} className={`flex-1 py-1 text-[7px] rounded uppercase font-bold transition-colors ${activeLayer === 'silkscreen' ? 'bg-zinc-700 text-white' : 'text-white/40 hover:bg-white/10'}`}>SILK</button>
            </div>
            
            <div className="text-[7px] text-white/50 uppercase font-black mb-1 mt-2">Visibility</div>
            <div className="flex flex-col gap-0.5">
               <button onClick={() => setVisibleLayers(p => ({...p, top: !p.top}))} className={`flex items-center justify-between px-2 py-1 text-[7px] rounded transition-colors ${visibleLayers.top ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/30 hover:bg-white/5'}`}>
                  <span>Top Copper</span>
                  {visibleLayers.top ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
               </button>
               <button onClick={() => setVisibleLayers(p => ({...p, bottom: !p.bottom}))} className={`flex items-center justify-between px-2 py-1 text-[7px] rounded transition-colors ${visibleLayers.bottom ? 'bg-blue-500/10 text-blue-400' : 'text-white/30 hover:bg-white/5'}`}>
                  <span>Bottom Copper</span>
                  {visibleLayers.bottom ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
               </button>
               <button onClick={() => setVisibleLayers(p => ({...p, silkscreen: !p.silkscreen}))} className={`flex items-center justify-between px-2 py-1 text-[7px] rounded transition-colors ${visibleLayers.silkscreen ? 'bg-zinc-500/10 text-zinc-300' : 'text-white/30 hover:bg-white/5'}`}>
                  <span>Silkscreen</span>
                  {visibleLayers.silkscreen ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
               </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            <BOMItem ref_id="U1" name="STM32F411" isSelected={selectedComponent === 'U1'} onClick={() => setSelectedComponent('U1')} />
            <BOMItem ref_id="R1" name="10k 0402" isSelected={selectedComponent === 'R1'} onClick={() => setSelectedComponent('R1')} />
            <BOMItem ref_id="C1" name="100nF 0402" isSelected={selectedComponent === 'C1'} onClick={() => setSelectedComponent('C1')} />
            <BOMItem ref_id="L1" name="LED BLUE" isSelected={selectedComponent === 'L1'} onClick={() => setSelectedComponent('L1')} />
            <BOMItem ref_id="OSC1" name="16MHz Crystal" isSelected={selectedComponent === 'OSC1'} onClick={() => setSelectedComponent('OSC1')} />
          </div>

          <button onClick={handleGenerateGerber} className="w-full py-2 bg-emerald-700/80 text-white text-[8px] font-bold uppercase rounded hover:bg-emerald-600 border border-emerald-500/50 transition-all flex items-center justify-center gap-2 group">
            <Download className="w-3 h-3 group-hover:scale-110 transition-transform" />
            {t("pcb.gerber")}
          </button>
        </div>
      </div>
    </div>
  );
}

function BOMItem({ ref_id, name, isSelected, onClick }: { ref_id: string, name: string, isSelected: boolean, onClick: () => void }) {
  return (
    <div 
        onClick={onClick}
        className={`flex items-center justify-between px-2 py-1.5 rounded text-[8px] cursor-pointer transition-all ${isSelected ? 'bg-white/10 border border-white/20' : 'border border-transparent hover:bg-white/5'}`}
    >
      <span className={`font-bold ${isSelected ? 'text-white' : 'text-emerald-500'}`}>{ref_id}</span>
      <span className={`truncate ml-2 ${isSelected ? 'text-white' : 'text-neutral-500'}`}>{name}</span>
    </div>
  );
}
