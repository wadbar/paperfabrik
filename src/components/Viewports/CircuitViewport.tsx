/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Cpu, Zap, Activity, Info } from "lucide-react";

export function CircuitViewport() {
  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-emerald-500/30">
      <div className="flex-1 bg-[#050505] rounded border border-white/5 relative p-4 flex gap-4 min-h-0 overflow-hidden">
        {/* PCB Canvas */}
        <div className="flex-1 border border-emerald-500/20 rounded-sm relative bg-[#0a2010]/20 overflow-hidden">
          {/* Copper Traces Background */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <svg className="w-full h-full text-emerald-500/60" viewBox="0 0 100 100">
            {/* PCB Traces */}
            <g fill="none" stroke="currentColor" strokeWidth="0.8">
              <motion.path 
                d="M 10 10 L 40 10 L 40 30 L 60 30" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.path 
                d="M 10 20 L 30 20 L 30 50 L 70 50" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <path d="M 80 80 L 80 60 L 50 60" />
            </g>

            {/* Vias/Pads */}
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            <circle cx="10" cy="20" r="1.5" fill="currentColor" />
            <circle cx="60" cy="30" r="1.5" fill="currentColor" />
            <circle cx="70" cy="50" r="2" fill="currentColor" />
            <circle cx="80" cy="80" r="1.5" fill="currentColor" />

            {/* IC Packages */}
            <rect x="35" y="45" width="20" height="20" rx="1" fill="#000" stroke="currentColor" strokeWidth="0.5" />
            <text x="45" y="57" textAnchor="middle" className="fill-emerald-400 text-[3px] font-bold">ARM_M4</text>
          </svg>

          {/* Logic Probe Indicator */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 border border-emerald-500/30 p-2 rounded">
             <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
             <div className="flex flex-col">
               <span className="text-[7px] text-emerald-500 uppercase font-black">Live Telemetry</span>
               <span className="text-[9px] text-white">CLOCK: 48MHz / VCC: 3.3V</span>
             </div>
          </div>
        </div>

        {/* BOM / Component Info */}
        <div className="w-32 flex flex-col gap-2 shrink-0">
          <div className="p-2 bg-emerald-500/5 rounded border border-emerald-500/20">
            <div className="text-[7px] text-emerald-500 uppercase font-black">Active Layer</div>
            <div className="text-[10px] text-white font-medium">Top Copper (F.Cu)</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <BOMItem ref_id="U1" name="STM32F411" />
            <BOMItem ref_id="R1" name="10k 0402" />
            <BOMItem ref_id="C1" name="100nF 0402" />
            <BOMItem ref_id="L1" name="LED BLUE" />
          </div>

          <button className="w-full py-1.5 bg-emerald-700 text-white text-[8px] font-bold uppercase rounded hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
            <Cpu className="w-3 h-3" />
            GENERATE GERBER
          </button>
        </div>
      </div>
    </div>
  );
}

function BOMItem({ ref_id, name }: { ref_id: string, name: string }) {
  return (
    <div className="flex items-center justify-between p-1 border-b border-white/5 text-[8px]">
      <span className="text-emerald-500 font-bold">{ref_id}</span>
      <span className="text-neutral-500 truncate ml-2">{name}</span>
    </div>
  );
}
