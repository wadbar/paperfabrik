import React, { useState } from "react";
import { motion } from "motion/react";
import { Palette, Layers, Sparkles, SlidersHorizontal, Image as ImageIcon } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export function PBRTexturingViewport() {
  const { t } = useI18n();
  const [activeMaterial, setActiveMaterial] = useState("smart_rust");
  
  const smartMaterials = [
    { id: "smart_rust", nameKey: "pbr.mat.rust", fallback: "Smart Rust", props: { roughness: 65, metalness: 10, ao: 100 } },
    { id: "chrome", nameKey: "pbr.mat.chrome", fallback: "Scratched Chrome", props: { roughness: 15, metalness: 90, ao: 95 } },
    { id: "wood", nameKey: "pbr.mat.wood", fallback: "Varnished Wood", props: { roughness: 30, metalness: 5, ao: 80 } },
    { id: "maple", nameKey: "pbr.mat.maple", fallback: "Maple", props: { roughness: 45, metalness: 2, ao: 75 } },
    { id: "steel", nameKey: "pbr.mat.steel", fallback: "Brushed Steel", props: { roughness: 20, metalness: 85, ao: 90 } }
  ];

  const activeMatObj = smartMaterials.find(m => m.id === activeMaterial) || smartMaterials[0];

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-purple-500/30">
      <div className="flex-1 rounded border border-white/5 relative flex gap-px bg-studio-grid min-h-0 overflow-hidden">
        
        {/* Layer Stack */}
        <div className="w-28 bg-[#0a0a0b] flex flex-col p-2 gap-2 shrink-0">
          <span className="text-[7px] text-purple-400 uppercase font-black mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3" /> {t("pbr.layers") || "Layers"}
          </span>
          <div className="flex-1 overflow-y-auto space-y-1">
            <div className="p-1.5 bg-purple-900/40 border border-purple-500/50 rounded flex items-center justify-between text-[8px] font-bold text-white cursor-pointer hover:bg-purple-500/30">
              <span className="flex items-center gap-1"><Sparkles className="w-2 h-2 text-purple-400"/> Dirt Mask</span>
              <span className="opacity-50">100%</span>
            </div>
            <div className="p-1.5 bg-white/5 border border-white/10 rounded flex items-center justify-between text-[8px] font-bold text-white/70 cursor-pointer hover:bg-white/10">
              <span className="flex items-center gap-1"><Palette className="w-2 h-2 text-yellow-500"/> Rust Base</span>
              <span className="opacity-50">85%</span>
            </div>
            <div className="p-1.5 bg-white/5 border border-white/10 rounded flex items-center justify-between text-[8px] font-bold text-white/70 cursor-pointer hover:bg-white/10">
              <span className="flex items-center gap-1"><ImageIcon className="w-2 h-2 text-blue-400"/> Steel Base</span>
              <span className="opacity-50">100%</span>
            </div>
          </div>
        </div>

        {/* 3D Material Canvas */}
        <div className="flex-1 bg-gradient-to-b from-[#1a1a1c] to-[#0a0a0b] relative flex items-center justify-center overflow-hidden">
           {/* Mock environment reflection */}
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-[#0a0a0b] to-[#0a0a0b] mix-blend-screen pointer-events-none" />
           
           <motion.svg 
             animate={{ rotateY: 360, rotateX: 360 }}
             transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
             className="w-40 h-40 drop-shadow-2xl" 
             viewBox="0 0 100 100" 
             style={{ filter: "drop-shadow(0px 10px 15px rgba(0,0,0,0.8))" }}
           >
             {/* 3D Sphere mockup */}
             <circle cx="50" cy="50" r="45" fill="url(#pbr-gradient)" />
             <ellipse cx="50" cy="20" rx="20" ry="10" fill="white" opacity="0.1" filter="blur(2px)" transform="rotate(-30 50 20)"/>
             {/* Grid/Topology wrapper */}
             <path d="M5 50 Q 50 100 95 50 M5 50 Q 50 0 95 50 M50 5 Q 100 50 50 95 M50 5 Q 0 50 50 95" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
             <defs>
               <radialGradient id="pbr-gradient" cx="30%" cy="30%" r="70%">
                 {activeMaterial === 'smart_rust' && (
                   <>
                     <stop offset="0%" stopColor="#8b4513" />
                     <stop offset="50%" stopColor="#d2691e" />
                     <stop offset="100%" stopColor="#4a2511" />
                   </>
                 )}
                 {activeMaterial === 'chrome' && (
                   <>
                     <stop offset="0%" stopColor="#e0e5ec" />
                     <stop offset="40%" stopColor="#7a8599" />
                     <stop offset="60%" stopColor="#2c3440" />
                     <stop offset="100%" stopColor="#1a1f26" />
                   </>
                 )}
                 {activeMaterial === 'wood' && (
                   <>
                     <stop offset="0%" stopColor="#a0522d" />
                     <stop offset="70%" stopColor="#5c3317" />
                     <stop offset="100%" stopColor="#2e1a0b" />
                   </>
                 )}
               </radialGradient>
             </defs>
           </motion.svg>

           {/* Channels overlay */}
           <div className="absolute top-2 right-2 flex gap-1">
             <div className="px-1.5 py-0.5 border border-purple-500/40 bg-purple-900/30 text-[7px] text-purple-400 rounded-sm uppercase font-bold text-center">ALB</div>
             <div className="px-1.5 py-0.5 border border-white/10 bg-black/40 text-[7px] text-white/50 hover:bg-white/10 rounded-sm uppercase font-bold text-center cursor-pointer transition-colors">NML</div>
             <div className="px-1.5 py-0.5 border border-white/10 bg-black/40 text-[7px] text-white/50 hover:bg-white/10 rounded-sm uppercase font-bold text-center cursor-pointer transition-colors">RGH</div>
             <div className="px-1.5 py-0.5 border border-white/10 bg-black/40 text-[7px] text-white/50 hover:bg-white/10 rounded-sm uppercase font-bold text-center cursor-pointer transition-colors">MTL</div>
           </div>
        </div>

        {/* Smart Materials & Properties */}
        <div className="w-36 bg-[#0a0a0b] flex flex-col p-2 gap-3 shrink-0 overflow-y-auto">
          <div>
            <span className="text-[7px] text-purple-400 uppercase font-black flex items-center gap-1 mb-1">
              <Palette className="w-3 h-3" /> {t("pbr.smart_materials") || "Smart Materials"}
            </span>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {smartMaterials.map(mat => (
                <div 
                  key={mat.id}
                  onClick={() => setActiveMaterial(mat.id)}
                  className={`p-2 rounded border cursor-pointer transition-colors flex flex-col items-center gap-1 text-center ${activeMaterial === mat.id ? 'bg-purple-900/40 border-purple-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className="w-8 h-8 rounded-full shadow-inner" style={{
                    background: mat.id === 'smart_rust' ? 'linear-gradient(to top right, #431407, #c2410c)' :
                                mat.id === 'chrome' ? 'linear-gradient(to top right, #9ca3af, #f3f4f6)' :
                                mat.id === 'wood' ? 'linear-gradient(to top right, #451a03, #92400e)' :
                                mat.id === 'maple' ? 'linear-gradient(to top right, #78350f, #d97706)' :
                                mat.id === 'steel' ? 'linear-gradient(to top right, #374151, #9ca3af)' :
                                'linear-gradient(to top right, #1f2937, #6b7280)'
                  }}/>
                  <span className={`text-[7px] font-bold ${activeMaterial === mat.id ? 'text-purple-300' : 'text-white/60'}`}>{t(mat.nameKey) || mat.fallback}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
             <span className="text-[7px] text-stone-400 uppercase font-black flex items-center gap-1 mb-2">
              <SlidersHorizontal className="w-3 h-3" /> {t("pbr.properties") || "Material Properties"}
             </span>
             <div className="space-y-3">
               <div>
                 <div className="flex justify-between text-[7px] text-white/60 uppercase font-bold mb-1">
                   <span>{t("pbr.roughness") || "Roughness"}</span>
                   <span>{activeMatObj?.props.roughness || 0}%</span>
                 </div>
                 <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-stone-400" style={{ width: `${activeMatObj?.props.roughness || 0}%` }}></div>
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-[7px] text-white/60 uppercase font-bold mb-1">
                   <span>{t("pbr.metalness") || "Metalness"}</span>
                   <span>{activeMatObj?.props.metalness || 0}%</span>
                 </div>
                 <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-stone-400" style={{ width: `${activeMatObj?.props.metalness || 0}%` }}></div>
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-[7px] text-white/60 uppercase font-bold mb-1">
                   <span>{t("pbr.ao") || "Ambient Occlusion"}</span>
                   <span>{activeMatObj?.props.ao || 0}%</span>
                 </div>
                 <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" style={{ width: `${activeMatObj?.props.ao || 0}%` }}></div>
                 </div>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
