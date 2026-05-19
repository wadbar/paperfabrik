import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code, Play, Save, Box, CornerRightDown } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useTelemetry } from "../../hooks/useTelemetry";

export function OpenSCADViewport() {
  const { t } = useI18n();
  const { recordEvent } = useTelemetry("OpenSCAD");
  const [code, setCode] = useState(`// OpenSCAD style script
difference() {
    cube([30, 30, 30], center=true);
    sphere(r=20);
}`);
  
  const [compiled, setCompiled] = useState(code);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileLog, setCompileLog] = useState("Ready.");

  const handleCompile = () => {
    setIsCompiling(true);
    setCompileLog("Compiling CSG tree...");
    recordEvent("SCAD_COMPILE_START", { scriptLength: code.length });
    setTimeout(() => {
      setCompiled(code);
      setIsCompiling(false);
      setCompileLog("Compile finished successfully. 2 volumes, 1 boolean operation.");
      recordEvent("SCAD_COMPILE_SUCCESS");
    }, 600);
  };

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-yellow-500/30">
      <div className="flex-1 rounded border border-white/5 relative flex bg-studio-dots min-h-0 overflow-hidden">
        
        {/* Editor Side */}
        <div className="w-1/2 flex flex-col border-r border-white/5 bg-[#0d1117] relative">
          <div className="flex justify-between items-center bg-[#0a0a0b] p-1.5 border-b border-white/5">
            <span className="text-[8px] text-yellow-500 font-bold uppercase flex items-center gap-1">
              <Code className="w-3 h-3" /> Editor
            </span>
            <div className="flex gap-1">
               <button 
                 onClick={handleCompile}
                 disabled={isCompiling}
                 className="px-2 py-1 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/40 rounded flex items-center gap-1 transition-colors"
               >
                 <Play className="w-2.5 h-2.5"/> {isCompiling ? "Compiling" : "Compile"}
               </button>
            </div>
          </div>
          <textarea
             className="flex-1 w-full bg-transparent text-white/80 p-3 font-mono text-[11px] resize-none outline-none focus:ring-1 focus:ring-yellow-500/50"
             value={code}
             onChange={e => setCode(e.target.value)}
             spellCheck={false}
          />
          {/* Console */}
          <div className="h-16 bg-[#050505] border-t border-white/5 p-2 text-[9px] overflow-y-auto">
             <div className="text-white/40 mb-1 flex items-center gap-1"><CornerRightDown className="w-2 h-2"/> Console</div>
             <div className="text-yellow-500/80">{compileLog}</div>
          </div>
        </div>

        {/* 3D Viewport Side */}
        <div className="w-1/2 flex flex-col relative bg-[#161b22] items-center justify-center overflow-hidden">
           {/* Canvas */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#eab308 1px, transparent 1px), linear-gradient(90deg, #eab308 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
           
           <AnimatePresence mode="wait">
             <motion.svg 
               key={compiled}
               className="w-full h-full" 
               viewBox="0 0 200 200"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.1 }}
               transition={{ duration: 0.3 }}
             >
               {/* 3D Representation of Boolean Ops */}
               <g transform="translate(100, 100) rotate(-20) rotate(30) scale(1.5)">
                 {/* Outer Cube Wireframe */}
                 {compiled.includes('cube') && (
                   <g className="text-yellow-500" strokeWidth="0.5">
                     <path d="M-15 -15 L15 -15 L15 15 L-15 15 Z M-15 -15 L-5 -25 L25 -25 L15 -15 M15 15 L25 5 L25 -25 M-15 15 L-5 5 L25 5 L-5 5 M-5 5 L-5 -25" fill="rgba(234, 179, 8, 0.1)" stroke="currentColor" />
                   </g>
                 )}
                 {/* Inner Sphere cutout representation */}
                 {compiled.includes('sphere') && compiled.includes('difference') && (
                   <g className="text-red-500/50" strokeWidth="0.5">
                      <circle cx="5" cy="-5" r="15" fill="none" stroke="currentColor" strokeDasharray="1 2" />
                      <ellipse cx="5" cy="-5" rx="15" ry="5" fill="none" stroke="currentColor" strokeDasharray="1 2" />
                   </g>
                 )}
               </g>
             </motion.svg>
           </AnimatePresence>

           <div className="absolute top-2 right-2 px-1.5 py-1 bg-black/40 border border-white/10 rounded text-yellow-500/60 font-bold text-[8px]">
              OpenSCAD Service
           </div>
        </div>

      </div>
    </div>
  );
}
