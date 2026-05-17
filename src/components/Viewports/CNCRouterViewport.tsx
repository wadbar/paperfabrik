/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Hammer, Zap, Play, Settings2, Activity } from "lucide-react";

export function CNCRouterViewport() {
  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-amber-500/30">
      <div className="flex-1 bg-studio-bg rounded border border-white/5 relative p-4 flex gap-4 min-h-0 overflow-hidden">
        {/* CNC Bed / Spoilboard Visualization */}
        <div className="flex-1 border border-wood-accent/20 flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-80 overflow-hidden rounded-sm">
           {/* Tool Path Grid */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#f59e0b 0.5px, transparent 0.5px), linear-gradient(90deg, #f59e0b 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
           
           <svg className="w-5/6 h-5/6 text-wood-accent/50 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]" viewBox="0 0 100 100" fill="none" stroke="currentColor">
              {/* Nested Parts for CNC Routing */}
              <rect x="5" y="5" width="25" height="25" rx="1" strokeWidth="0.5" strokeDasharray="1" />
              <rect x="35" y="5" width="25" height="25" rx="1" strokeWidth="0.5" strokeDasharray="1" />
              <path d="M65 5 L95 5 L95 30 L65 30 Z" strokeWidth="0.5" strokeDasharray="1" />
              
              {/* Computed Tool Path (Profiling) */}
              <motion.path 
                d="M 5 5 L 30 5 L 30 30 L 5 30 Z M 35 5 L 60 5 L 60 30 L 35 30 Z" 
                stroke="#f59e0b" 
                strokeWidth="0.8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />

              {/* Bit indicator */}
              <motion.circle 
                r="1.5" 
                fill="#f59e0b"
                animate={{ 
                  cx: [5, 30, 30, 5, 5, 35, 60, 60, 35, 35],
                  cy: [5, 5, 30, 30, 5, 5, 5, 30, 30, 5]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />

              <text x="50" y="90" className="fill-wood-accent text-[4px] uppercase font-bold tracking-widest text-center" textAnchor="middle">
                ROUTER_BED_V4: 1200mm x 2400mm
              </text>
           </svg>

           <div className="absolute top-2 left-2 flex gap-2">
             <div className="px-1.5 py-0.5 bg-wood-accent/10 border border-wood-accent/30 text-[7px] text-wood-accent rounded uppercase font-bold">Tool: End Mill 1/4"</div>
             <div className="px-1.5 py-0.5 bg-black/40 border border-white/10 text-[7px] text-white/60 rounded uppercase font-bold">Offset: Exterior</div>
           </div>
        </div>
        
        {/* Machining Parameters */}
        <div className="w-36 flex flex-col gap-2 shrink-0">
          <div className="p-2 bg-wood-accent/5 rounded border border-wood-accent/20 group hover:border-wood-accent/50 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[7px] text-wood-accent uppercase font-black">Spindle Load</span>
              <Activity className="w-2 h-2 text-wood-accent animate-pulse" />
            </div>
            <div className="text-[12px] text-white font-black italic">18,500 <span className="text-[8px] font-normal not-italic opacity-40">RPM</span></div>
            <div className="h-1 w-full bg-white/5 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-wood-accent w-2/3" />
            </div>
          </div>

          <div className="p-2 bg-black/20 rounded border border-white/5">
            <div className="text-[7px] text-stone-500 uppercase font-black">Feed Rate</div>
            <div className="text-[10px] text-white font-medium">4,200 <span className="text-[7px] opacity-40">mm/min</span></div>
          </div>

          <div className="p-2 bg-black/20 rounded border border-white/5">
            <div className="text-[7px] text-stone-500 uppercase font-black">Plunge Rate</div>
            <div className="text-[10px] text-white font-medium">800 <span className="text-[7px] opacity-40">mm/min</span></div>
          </div>

          <div className="mt-auto space-y-1">
             <button className="w-full flex items-center justify-between px-2 py-1.5 bg-wood-accent/10 border border-wood-accent/30 text-wood-accent hover:bg-wood-accent hover:text-white transition-all text-[8px] font-bold uppercase">
               RUN JOB <Play className="w-2 h-2" />
             </button>
             <button className="w-full flex items-center justify-between px-2 py-1 bg-studio-panel border border-studio-border text-stone-500 hover:text-white transition-all text-[8px] font-bold uppercase">
               SETTINGS <Settings2 className="w-2 h-2" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
