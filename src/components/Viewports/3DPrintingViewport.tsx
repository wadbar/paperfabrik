import { Box, Layers, Play, Settings, Wand2, ArrowDownToLine, MoreHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useI18n } from "../../lib/i18n";

export function ThreeDPrintingViewport() {
  const { t } = useI18n();
  const [modifiers, setModifiers] = useState([
    { id: 1, name: "Subdivision Surface", type: "subdiv", enabled: true },
    { id: 2, name: "Bevel", type: "bevel", enabled: true },
    { id: 3, name: "Array", type: "array", enabled: false }
  ]);

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-orange-500/30">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 bg-studio-bg rounded border border-white/5 relative flex bg-[#1c1c1c] overflow-hidden">
          
          {/* Outliner / Modifier Stack */}
          <div className="w-40 border-r border-white/5 bg-[#141414] flex flex-col overflow-y-auto">
             <div className="px-2 py-1 border-b border-white/5 flex justify-between items-center bg-[#1c1c1c]">
                <span className="text-[8px] uppercase font-bold text-orange-500 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" /> Modifiers
                </span>
             </div>
             <div className="p-1 space-y-1">
               {modifiers.map(mod => (
                 <div key={mod.id} className="bg-[#2b2b2b] border border-white/5 rounded-sm p-1.5 flex flex-col gap-1">
                    <div className="flex justify-between items-center cursor-pointer hover:text-white transition-colors"
                         onClick={() => setModifiers(modifiers.map(m => m.id === mod.id ? {...m, enabled: !m.enabled} : m))}>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${mod.enabled ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'bg-white/20'}`} />
                        <span className={`text-[8px] font-bold ${mod.enabled ? 'text-white' : 'text-neutral-500'}`}>{mod.name}</span>
                      </div>
                      <MoreHorizontal className="w-3 h-3 text-white/30" />
                    </div>
                    {mod.enabled && mod.type === "subdiv" && (
                      <div className="pl-3 text-[7px] text-white/50 flex flex-col gap-0.5 mt-1">
                         <div className="flex justify-between"><span>Levels Viewport</span><span>2</span></div>
                         <div className="flex justify-between"><span>Render</span><span>3</span></div>
                      </div>
                    )}
                 </div>
               ))}
               <button className="w-full py-1 mt-1 border border-white/10 hover:bg-white/5 rounded-sm text-[8px] text-white/50 font-bold uppercase transition-colors">
                 Add Modifier
               </button>
             </div>
          </div>

          {/* 3D Viewport */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
             {/* Blender Background */}
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#a3a3a3 1px, transparent 1px), linear-gradient(90deg, #a3a3a3 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
             
             {/* Axes */}
             <div className="absolute w-full h-[1px] bg-red-500/30 top-1/2 -translate-y-1/2" />
             <div className="absolute h-full w-[1px] bg-green-500/30 left-1/2 -translate-x-1/2" />

             <motion.svg 
               animate={{ rotateX: [20, -20, 20], rotateY: [-20, 20, -20] }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="w-48 h-48 drop-shadow-2xl z-10" 
               viewBox="0 0 100 100" 
               fill="none" 
               stroke="currentColor"
               style={{ perspective: 1000 }}
             >
                {/* Visualizing "Subdivision" state */}
                {modifiers.find(m => m.type === "subdiv")?.enabled ? (
                  <path d="M50 15 C70 15 85 30 85 50 C85 70 70 85 50 85 C30 85 15 70 15 50 C15 30 30 15 50 15 Z" fill="#2d2d2d" stroke="#f97316" strokeWidth={0.5} />
                ) : (
                  <path d="M20 20 L80 20 L80 80 L20 80 Z" fill="#2d2d2d" stroke="#f97316" strokeWidth={0.5} />
                )}
                
                {/* Visualizing Array state */}
                {modifiers.find(m => m.type === "array")?.enabled && (
                  <>
                     {modifiers.find(m => m.type === "subdiv")?.enabled ? (
                       <path d="M50 15 C70 15 85 30 85 50 C85 70 70 85 50 85 C30 85 15 70 15 50 C15 30 30 15 50 15 Z" fill="none" stroke="#f97316" strokeWidth={0.2} strokeDasharray="1 1" transform="translate(40, 0)" />
                     ) : (
                       <path d="M20 20 L80 20 L80 80 L20 80 Z" fill="none" stroke="#f97316" strokeWidth={0.2} strokeDasharray="1 1" transform="translate(40, 0)" />
                     )}
                  </>
                )}
             </motion.svg>
          </div>
        </div>

      </div>
    </div>
  );
}
