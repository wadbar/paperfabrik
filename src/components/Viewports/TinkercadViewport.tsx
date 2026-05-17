import React, { useState } from "react";
import { motion } from "motion/react";
import { Cpu, Play, Square, Code, Terminal } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export function TinkercadViewport() {
  const { t } = useI18n();
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'schematic' | 'code'>('code');

  const defaultCode = `void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(1000);
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(1000);
}`;

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-cyan-500/30">
      <div className="flex-1 bg-[#050505] rounded border border-white/5 relative p-4 flex flex-col gap-2 min-h-0 overflow-hidden">
        
        {/* Top bar */}
        <div className="flex justify-between items-center bg-white/5 p-1.5 rounded border border-white/10 shrink-0">
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab('schematic')}
              className={`px-3 py-1 text-[9px] uppercase font-bold rounded transition-colors ${activeTab === 'schematic' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/30' : 'text-neutral-500 hover:text-white'}`}
            >
              Hardware
            </button>
            <button 
               onClick={() => setActiveTab('code')}
              className={`px-3 py-1 flex items-center gap-1 text-[9px] uppercase font-bold rounded transition-colors ${activeTab === 'code' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/30' : 'text-neutral-500 hover:text-white'}`}
            >
              <Code className="w-3 h-3" /> Code (C++)
            </button>
          </div>
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-1 flex items-center gap-1.5 text-[9px] uppercase font-bold rounded transition-colors ${isRunning ? 'bg-red-900/40 text-red-500 border border-red-500/30 hover:bg-red-900/60' : 'bg-green-900/40 text-green-500 border border-green-500/30 hover:bg-green-900/60'}`}
          >
            {isRunning ? (
              <><Square className="w-3 h-3" /> Stop Simulation</>
            ) : (
              <><Play className="w-3 h-3" /> Start Simulation</>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 gap-2 min-h-0 shrink-0">
          
          {/* Main View */}
          <div className="flex-1 border border-cyan-500/20 rounded relative bg-[#0a1a20]/20 overflow-hidden flex flex-col">
            
            {activeTab === 'code' ? (
               <div className="flex-1 w-full bg-[#0d1117] text-cyan-50 p-3 font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-auto outline-none" contentEditable suppressContentEditableWarning spellCheck={false}>
                 <pre className="m-0"><code className="text-cyan-300">{defaultCode}</code></pre>
               </div>
            ) : (
              <div className="flex-1 relative flex items-center justify-center">
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                 <svg className="w-48 h-auto drop-shadow-xl" viewBox="0 0 200 120">
                   {/* Arduino Board mock */}
                   <rect x="20" y="20" width="160" height="80" rx="4" fill="#006468" stroke="#004346" strokeWidth="2" />
                   {/* USB Port */}
                   <rect x="10" y="30" width="15" height="20" rx="1" fill="#silver" stroke="#666" />
                   {/* Power Jack */}
                   <rect x="10" y="60" width="15" height="15" rx="1" fill="#111" stroke="#333" />
                   {/* Atmel Chip */}
                   <rect x="100" y="45" width="40" height="15" fill="#111" />
                   <text x="120" y="54" className="text-[4px] fill-neutral-500" textAnchor="middle">ATmega328P</text>
                   {/* Pin Headers */}
                   <rect x="40" y="22" width="60" height="6" fill="#111" />
                   <rect x="110" y="22" width="60" height="6" fill="#111" />
                   <rect x="60" y="92" width="50" height="6" fill="#111" />
                   <rect x="120" y="92" width="50" height="6" fill="#111" />

                   {/* LED connected to Pin 13 */}
                   <g transform="translate(185, 30)">
                     {/* Resistor */}
                     <path d="M-15 0 L-10 0 L-8 -3 L-4 3 L0 -3 L4 3 L6 0 L15 0" stroke="#a3a3a3" strokeWidth="1" fill="none" />
                     {/* LED */}
                     <circle cx="20" cy="0" r="4" fill={isRunning ? "#ff0000" : "#440000"} stroke="#ff0000" strokeWidth="0.5" className="transition-colors duration-200" />
                     <motion.circle 
                       cx="20" cy="0" r="6" 
                       fill="none" 
                       stroke={isRunning ? "#ff0000" : "transparent"} 
                       strokeWidth="1"
                       initial={{ opacity: 0 }}
                       animate={isRunning ? { opacity: [0, 0.5, 0], scale: [1, 1.5, 1] } : { opacity: 0 }}
                       transition={{ duration: 1, repeat: Infinity }}
                     />
                   </g>

                   {/* Connection Wires */}
                   <path d="M 170 25 L 170 30" stroke="#ff0000" strokeWidth="1" fill="none" />
                   <path d="M 160 25 L 160 10 L 205 10 L 205 30" stroke="#000000" strokeWidth="1" fill="none" />
                 </svg>
              </div>
            )}
            
          </div>

          {/* Serial Monitor */}
          <div className="w-32 bg-[#050505] border border-cyan-500/20 rounded-sm flex flex-col shrink-0">
             <div className="bg-cyan-900/30 text-cyan-400 text-[8px] uppercase font-bold p-1.5 flex items-center justify-between border-b border-cyan-500/20">
                <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> Monitor</span>
                <span>BAUD 9600</span>
             </div>
             <div className="flex-1 p-2 overflow-y-auto font-mono text-[8px] text-white/70 space-y-1">
               {isRunning ? (
                 <>
                  <div>System Intialized...</div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>LED ON</motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>LED OFF</motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>LED ON</motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}>LED OFF</motion.div>
                 </>
               ) : (
                 <div className="text-neutral-600 italic">Waiting for simulation...</div>
               )}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
