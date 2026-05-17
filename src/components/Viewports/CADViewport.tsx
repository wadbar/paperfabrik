/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ruler, Compass, Box, Layers, MousePointer2, Settings2, Link, X, Check, ChevronDown } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useTelemetry } from "../../hooks/useTelemetry";

interface RenderSettings {
  resolution: 'Low' | 'Medium' | 'High';
  antiAliasing: boolean;
  outputFormat: 'PNG' | 'JPG' | 'STL';
}

export function CADViewport() {
  const { t } = useI18n();
  const { recordEvent } = useTelemetry("CADViewport");
  const [radius, setRadius] = useState(40);
  const [sides, setSides] = useState(6);
  const [extrude, setExtrude] = useState(20);

  // Render Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<RenderSettings>({
    resolution: 'Medium',
    antiAliasing: true,
    outputFormat: 'PNG',
  });
  const [savedSettings, setSavedSettings] = useState<RenderSettings>({
    resolution: 'Medium',
    antiAliasing: true,
    outputFormat: 'PNG',
  });

  const handleSaveSettings = () => {
    setSavedSettings(tempSettings);
    setIsSettingsOpen(false);
    recordEvent("RENDER_SETTINGS_SAVED", tempSettings);
  };

  const handleOpenSettings = () => {
    setTempSettings(savedSettings);
    setIsSettingsOpen(true);
    recordEvent("RENDER_SETTINGS_OPENED");
  };

  const polygonPath = useMemo(() => {
    let d = "";
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const x = 100 + radius * Math.cos(angle);
      const y = 100 + radius * Math.sin(angle);
      if (i === 0) d += `M${x} ${y}`;
      else d += ` L${x} ${y}`;
    }
    return d + " Z";
  }, [radius, sides]);

  const extrudePath = useMemo(() => {
    let d = "";
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const x1 = 100 + radius * Math.cos(angle);
      const y1 = 100 + radius * Math.sin(angle);
      const x2 = x1;
      const y2 = y1 - extrude;
      d += `M${x1} ${y1} L${x2} ${y2} `;
    }
    return d;
  }, [radius, sides, extrude]);

  const topPolygonPath = useMemo(() => {
    let d = "";
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const x = 100 + radius * Math.cos(angle);
      const y = 100 - extrude + radius * Math.sin(angle);
      if (i === 0) d += `M${x} ${y}`;
      else d += ` L${x} ${y}`;
    }
    return d + " Z";
  }, [radius, sides, extrude]);


  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-blue-500/30">
      <div className="flex-1 bg-studio-bg rounded border border-white/5 relative flex gap-px bg-studio-grid min-h-0 overflow-hidden">
        {/* Parametric Tree & Properties (FreeCAD/SolveSpace style) */}
        <div className="w-32 bg-[#0a0a0b] flex flex-col p-2 gap-2 shrink-0 overflow-y-auto border-r border-white/5">
          <span className="text-[7px] text-blue-400 uppercase font-black mb-1 flex items-center gap-1">
             <Layers className="w-3 h-3" /> {t("cad.tree")}
          </span>
          <TreeItem name="Sketch_01" icon={MousePointer2} active />
          
          <div className="pl-3 py-1 space-y-2 border-b border-white/5 pb-3">
             <div className="flex flex-col gap-1 text-[8px] text-white/70">
                <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1"><Link className="w-2 h-2"/> Radius</span>
                   <input type="number" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-10 bg-black border border-blue-500/30 px-1 rounded text-right focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1"><Link className="w-2 h-2"/> Sides</span>
                   <input type="number" value={sides} onChange={e => setSides(Number(e.target.value))} min={3} max={12} className="w-10 bg-black border border-blue-500/30 px-1 rounded text-right focus:outline-none focus:border-blue-500" />
                </div>
             </div>
          </div>

          <TreeItem name="Extrude_Pad" icon={Box} />
          
          <div className="pl-3 py-1 space-y-2">
             <div className="flex flex-col gap-1 text-[8px] text-white/70">
                <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1"><Box className="w-2 h-2"/> Length</span>
                   <input type="number" value={extrude} onChange={e => setExtrude(Number(e.target.value))} className="w-10 bg-black border border-blue-500/30 px-1 rounded text-right focus:outline-none focus:border-blue-500" />
                </div>
             </div>
          </div>

        </div>

        {/* CAD Canvas */}
        <div className="flex-1 relative bg-[#0d1117] flex items-center justify-center overflow-hidden">
           {/* Technical Grid Overlay */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
           
           <svg className="w-full h-full text-blue-400" viewBox="0 0 200 200">
             {/* Origin/Axes */}
             <g className="opacity-40">
               <path d="M100 20 L100 180 M20 100 L180 100" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 2" />
               <circle cx="100" cy="100" r="1.5" fill="#3b82f6" />
             </g>

             {/* Sketch Base */}
             <g className="text-blue-500/30">
               <path d={polygonPath} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
             </g>

             {/* Extrusion lines */}
             <g className="text-blue-400/50">
                <path d={extrudePath} stroke="currentColor" strokeWidth="1" fill="none" />
             </g>

             {/* Top Solid Face */}
             <g className="text-blue-300">
               <motion.path 
                 d={topPolygonPath} 
                 fill="rgba(59,130,246,0.1)" 
                 stroke="currentColor" 
                 strokeWidth="1.5"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
               />
             </g>

             {/* Constraint visualizer (FreeCAD/SolveSpace style datum constraints) */}
             <g className="text-emerald-400 text-[6px]">
               {/* Radius dimension */}
               <line x1="100" y1="100" x2={100 + radius * Math.cos(-Math.PI/2)} y2={100 + radius * Math.sin(-Math.PI/2)} stroke="currentColor" strokeWidth="0.5" />
               <circle cx={100 + radius * Math.cos(-Math.PI/2) / 2} cy={100 - radius/2} r="8" fill="#0d1117" stroke="currentColor" strokeWidth="0.5" />
               <text x={100 + radius * Math.cos(-Math.PI/2) / 2} y={100 - radius/2 + 2} textAnchor="middle" fill="currentColor">R{radius}</text>
               
               {/* Extrude height dimension */}
               <line x1="180" y1="100" x2="180" y2={100 - extrude} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="1 1" />
               <text x="185" y={100 - extrude/2 + 2} fill="#f59e0b">L{extrude}</text>
             </g>
           </svg>

           {/* Viewport controls (Blender style) */}
           <div className="absolute top-2 right-2 flex gap-1 z-10">
             <div className="px-1.5 py-1 bg-black/40 border border-white/10 rounded cursor-pointer hover:bg-white/10 text-white/60 transition-colors">
                 <Box className="w-3 h-3" />
             </div>
             <button 
               onClick={handleOpenSettings}
               className={`px-1.5 py-1 rounded cursor-pointer transition-all border ${isSettingsOpen ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/10'}`}
               title={t("cad.render_settings")}
             >
                 <Settings2 className="w-3 h-3" />
             </button>
           </div>

           {/* Render Settings Modal */}
           <AnimatePresence>
             {isSettingsOpen && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 10 }}
                 className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                 onClick={() => setIsSettingsOpen(false)}
               >
                 <motion.div 
                   className="w-full max-w-sm bg-[#0a0a0b] border border-white/10 rounded shadow-2xl overflow-hidden flex flex-col"
                   onClick={(e) => e.stopPropagation()}
                 >
                   {/* Header */}
                   <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                     <div className="flex items-center gap-2">
                       <Settings2 className="w-4 h-4 text-blue-400" />
                       <span className="font-black text-[9px] uppercase tracking-widest text-white/90">Render Settings</span>
                     </div>
                     <button 
                       onClick={() => setIsSettingsOpen(false)}
                       className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>

                   {/* Content */}
                   <div className="p-5 space-y-6">
                     {/* Resolution Slider */}
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-[8px] uppercase tracking-tighter">
                         <span className="text-white/50">Output Resolution</span>
                         <span className="text-blue-400 font-bold">{tempSettings.resolution}</span>
                       </div>
                       <div className="relative pt-4">
                         <input 
                           type="range" 
                           min="0" 
                           max="2" 
                           step="1"
                           value={['Low', 'Medium', 'High'].indexOf(tempSettings.resolution)}
                           onChange={(e) => {
                             const options: RenderSettings['resolution'][] = ['Low', 'Medium', 'High'];
                             setTempSettings({...tempSettings, resolution: options[parseInt(e.target.value)]});
                           }}
                           className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                         />
                         <div className="flex justify-between px-1 mt-2 text-[7px] text-white/30 uppercase">
                           <span>Low</span>
                           <span>Med</span>
                           <span>High</span>
                         </div>
                       </div>
                     </div>

                     {/* Anti-Aliasing Toggle */}
                     <div className="flex items-center justify-between group">
                       <div className="flex flex-col gap-0.5">
                         <span className="text-[8px] uppercase tracking-tighter text-white/50">Anti-Aliasing</span>
                         <span className="text-[7px] text-white/30">Smooth vector rendering</span>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input 
                           type="checkbox" 
                           className="sr-only peer"
                           checked={tempSettings.antiAliasing}
                           onChange={(e) => setTempSettings({...tempSettings, antiAliasing: e.target.checked})}
                         />
                         <div className="w-8 h-4 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                       </label>
                     </div>

                     {/* Output Format Dropdown */}
                     <div className="space-y-2">
                       <span className="text-[8px] uppercase tracking-tighter text-white/50">Export Format</span>
                       <div className="relative group">
                         <select 
                           value={tempSettings.outputFormat}
                           onChange={(e) => setTempSettings({...tempSettings, outputFormat: e.target.value as any})}
                           className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-[9px] text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors"
                         >
                           <option value="PNG" className="bg-[#0a0a0b]">PNG Image (.png)</option>
                           <option value="JPG" className="bg-[#0a0a0b]">JPEG Image (.jpg)</option>
                           <option value="STL" className="bg-[#0a0a0b]">STL Mesh (.stl)</option>
                         </select>
                         <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none group-hover:text-white/60 transition-colors" />
                       </div>
                     </div>
                   </div>

                   {/* Footer */}
                   <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex gap-2">
                     <button 
                       onClick={() => setIsSettingsOpen(false)}
                       className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-[9px] uppercase font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={handleSaveSettings}
                       className="flex-1 px-3 py-2 rounded bg-blue-600 border border-blue-500 text-[9px] uppercase font-bold text-white hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-1.5"
                     >
                       <Check className="w-3 h-3" /> Save Changes
                     </button>
                   </div>
                 </motion.div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Toolbar */}
        <div className="w-12 bg-[#0a0a0b] border-l border-white/5 flex flex-col p-2 gap-2 shrink-0 items-center">
          <ToolIcon icon={MousePointer2} active />
          <ToolIcon icon={Compass} />
          <ToolIcon icon={Ruler} />
          <ToolIcon icon={Layers} />
        </div>
      </div>
    </div>
  );
}

function TreeItem({ name, icon: Icon, active }: { name: string, icon: any, active?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 p-1 rounded-sm cursor-pointer transition-colors ${active ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}>
      <Icon className="w-2.5 h-2.5" />
      <span className="text-[8px] truncate tracking-tight">{name}</span>
    </div>
  );
}

function ToolIcon({ icon: Icon, active }: { icon: any, active?: boolean }) {
  return (
    <div className={`p-1.5 rounded cursor-pointer transition-all ${active ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}
