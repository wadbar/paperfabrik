/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Ruler, Compass, Box, Layers, MousePointer2, Settings2, Link } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export function CADViewport() {
  const { t } = useI18n();
  const [radius, setRadius] = useState(40);
  const [sides, setSides] = useState(6);
  const [extrude, setExtrude] = useState(20);

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
           <div className="absolute top-2 right-2 flex gap-1">
             <div className="px-1.5 py-1 bg-black/40 border border-white/10 rounded cursor-pointer hover:bg-white/10 text-white/60">
                 <Box className="w-3 h-3" />
             </div>
             <div className="px-1.5 py-1 bg-black/40 border border-white/10 rounded cursor-pointer hover:bg-white/10 text-white/60">
                 <Settings2 className="w-3 h-3" />
             </div>
           </div>
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
