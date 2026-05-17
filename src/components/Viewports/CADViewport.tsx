/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Ruler, Compass, Box, Layers, MousePointer2 } from "lucide-react";

export function CADViewport() {
  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-blue-500/30">
      <div className="flex-1 bg-studio-bg rounded border border-white/5 relative flex gap-px bg-studio-grid min-h-0 overflow-hidden">
        {/* Parametric Tree */}
        <div className="w-24 bg-studio-panel/50 border-r border-studio-grid flex flex-col p-2 gap-1 shrink-0">
          <span className="text-[7px] text-studio-muted uppercase font-black mb-1">Feature Tree</span>
          <TreeItem name="Base_Sketch" icon={MousePointer2} active />
          <TreeItem name="Extrude_01" icon={Box} />
          <TreeItem name="Fillet_Core" icon={Compass} />
          <TreeItem name="Shell_V2" icon={Layers} />
          <TreeItem name="Pattern_Circular" icon={Ruler} />
        </div>

        {/* CAD Canvas */}
        <div className="flex-1 relative bg-black/40 flex items-center justify-center">
           {/* Technical Grid Overlay */}
           <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
           
           <svg className="w-full h-full text-blue-400/40" viewBox="0 0 200 200">
             {/* Constraints Indicators */}
             <g className="opacity-60">
               <path d="M100 20 L100 180 M20 100 L180 100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
               <circle cx="100" cy="100" r="1.5" fill="currentColor" />
             </g>

             {/* 3D Part Wireframe (Isometric representation) */}
             <g className="text-blue-500">
               <motion.path 
                 d="M100 60 L140 80 L140 120 L100 140 L60 120 L60 80 Z" 
                 fill="none" 
                 stroke="currentColor" 
                 strokeWidth="1"
                 initial={{ pathLength: 0 }}
                 animate={{ pathLength: 1 }}
                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               />
               <path d="M100 60 L100 140 M60 80 L100 100 L140 80 M100 100 L140 120 M100 100 L60 120 shadow-blue-500/50" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
             </g>

             {/* Dimensions */}
             <g className="text-studio-muted text-[6px]">
               <line x1="60" y1="130" x2="140" y2="130" stroke="currentColor" strokeWidth="0.3" />
               <text x="100" y="138" textAnchor="middle" fill="currentColor">80.00mm</text>
               
               <line x1="50" y1="120" x2="50" y2="80" stroke="currentColor" strokeWidth="0.3" />
               <text x="45" y="100" textAnchor="middle" fill="currentColor" transform="rotate(-90 45,100)">40.00mm</text>
             </g>

             {/* Constraints Icons */}
             <rect x="58" y="78" width="4" height="4" fill="currentColor" className="text-green-500/40" />
             <rect x="138" y="78" width="4" height="4" fill="currentColor" className="text-green-500/40" />
           </svg>

           {/* View Cube */}
           <div className="absolute top-4 right-4 w-10 h-10 border border-studio-border bg-studio-panel/80 flex items-center justify-center text-[8px] font-bold text-studio-muted">
             TOP
           </div>
        </div>

        {/* Toolbar */}
        <div className="w-10 bg-studio-panel/50 border-l border-studio-grid flex flex-col p-2 gap-3 shrink-0 items-center">
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
    <div className={`flex items-center gap-1.5 p-1 rounded-sm cursor-pointer transition-colors ${active ? 'bg-blue-500/10 text-blue-400' : 'text-studio-muted hover:text-white hover:bg-white/5'}`}>
      <Icon className="w-2.5 h-2.5" />
      <span className="text-[8px] truncate tracking-tight">{name}</span>
    </div>
  );
}

function ToolIcon({ icon: Icon, active }: { icon: any, active?: boolean }) {
  return (
    <div className={`p-1.5 rounded cursor-pointer transition-all ${active ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-studio-muted hover:text-white hover:bg-white/10'}`}>
      <Icon className="w-3 h-3" />
    </div>
  );
}
