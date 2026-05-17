/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Home, Ruler, Layers, BoxSelect, ZoomIn } from "lucide-react";

export function BIMViewport() {
  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-orange-500/30">
      <div className="flex-1 bg-studio-bg rounded border border-white/5 relative flex min-h-0 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/blueprint.png')]">
        
        {/* Properties Panel */}
        <div className="w-40 bg-zinc-950/80 backdrop-blur-sm border-r border-orange-500/20 flex flex-col p-2 shrink-0 overflow-y-auto">
          <div className="text-[7px] text-orange-500 uppercase font-black mb-2 flex items-center gap-1">
            <Home className="w-3 h-3" /> REVIT / BIM DATA
          </div>
          
          <div className="space-y-4">
            <PropertySection title="Custom Beam (Timber)" id="B-104">
              <PropertyRow label="Length" value="3200mm" />
              <PropertyRow label="Profile" value="150x50mm" />
              <PropertyRow label="Material" value="Oak, Solid" />
              <PropertyRow label="Join" value="Mortise & Tenon" />
            </PropertySection>

            <PropertySection title="CNC Cut Path" id="SYS">
              <PropertyRow label="Tool" value="Flat End 12mm" />
              <PropertyRow label="Passes" value="4 x 12.5mm" />
              <PropertyRow label="Est. Time" value="18m 42s" />
            </PropertySection>
          </div>

          <button className="w-full mt-auto py-1.5 bg-orange-600/20 border border-orange-500/50 text-orange-500 text-[8px] font-bold uppercase hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-1">
            <BoxSelect className="w-3 h-3" />
            ISOLATE PART
          </button>
        </div>

        {/* 3D Viewport Simulation */}
        <div className="flex-1 relative bg-gradient-to-b from-blue-900/10 to-zinc-900/50 flex items-center justify-center">
            
            <svg className="w-full h-full text-zinc-400" viewBox="0 0 400 300">
               {/* Grid */}
               <path d="M 0 150 Q 200 200 400 150 M 200 50 L 200 250" stroke="currentColor" strokeWidth="0.2" opacity="0.3" fill="none" />
               <path d="M 100 120 L 300 180 M 300 120 L 100 180" stroke="currentColor" strokeWidth="0.2" opacity="0.3" fill="none" />

               {/* Abstract Architectural frame */}
               <g className="text-orange-500/80" fill="none" stroke="currentColor" strokeWidth="1">
                 {/* Main stud */}
                 <motion.path 
                   d="M 180 80 L 200 70 L 200 220 L 180 230 Z" 
                   fill="rgba(249,115,22,0.1)"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 1 }}
                 />
                 <path d="M 200 70 L 220 80 L 220 230 L 200 220" opacity="0.5" />
                 
                 {/* Connecting beam (Custom Part) */}
                 <motion.path 
                   d="M 200 100 L 320 160 L 320 180 L 200 120 Z" 
                   fill="rgba(249,115,22,0.3)"
                   strokeWidth="1.5"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 0.5, duration: 1 }}
                 />
                 <path d="M 320 160 L 340 150 L 340 170 L 320 180" opacity="0.5" />

                 {/* Cutting Tool Path Indicator */}
                 <motion.path 
                    d="M 200 105 L 315 162" 
                    stroke="#fff" 
                    strokeWidth="0.5" 
                    strokeDasharray="2 2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
                 />
               </g>

               {/* Annotations */}
               <g className="text-orange-300 text-[6px]">
                  <line x1="200" y1="110" x2="160" y2="110" stroke="currentColor" strokeWidth="0.5" />
                  <text x="155" y="112" textAnchor="end" fill="currentColor">B-104 (Oak)</text>

                  <line x1="260" y1="130" x2="260" y2="100" stroke="currentColor" strokeWidth="0.5" />
                  <text x="260" y="95" textAnchor="middle" fill="currentColor" className="font-bold">3200mm</text>
               </g>
            </svg>

            {/* Viewport controls */}
            <div className="absolute right-2 bottom-2 flex flex-col gap-1">
               <ControlBtn icon={ZoomIn} />
               <ControlBtn icon={Layers} />
               <ControlBtn icon={Ruler} />
            </div>

        </div>

      </div>
    </div>
  );
}

function PropertySection({ title, id, children }: { title: string, id: string, children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] text-white font-bold mb-1 flex justify-between items-center bg-white/5 px-1 py-0.5 rounded">
        <span>{title}</span>
        <span className="text-[7px] text-white/40">{id}</span>
      </div>
      <div className="space-y-0.5 px-1">
        {children}
      </div>
    </div>
  );
}

function PropertyRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-[9px]">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300 font-medium">{value}</span>
    </div>
  );
}

function ControlBtn({ icon: Icon }: { icon: any }) {
  return (
    <button className="p-1.5 bg-black/50 border border-white/10 text-zinc-400 hover:text-white hover:bg-orange-500/20 transition-all rounded">
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
