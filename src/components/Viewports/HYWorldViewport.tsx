import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Image as ImageIcon, Map, Layers, Rotate3D, Video } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export function HYWorldViewport() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'reconstruct' | 'generate'>('reconstruct');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processState, setProcessState] = useState(0); // 0=idle, 1=processing, 2=done

  const handleRun = () => {
    setIsProcessing(true);
    setProcessState(1);
    setTimeout(() => {
      setProcessState(2);
      setIsProcessing(false);
    }, 2500);
  };

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-pink-500/30">
      <div className="flex-1 bg-[#0a0a0b] rounded border border-white/5 relative p-4 flex flex-col gap-2 min-h-0 overflow-hidden">
        
        {/* Top Header / Mode Switcher */}
        <div className="flex justify-between items-center bg-white/5 p-1.5 rounded border border-white/10 shrink-0">
          <div className="flex gap-1">
            <button 
              onClick={() => { setActiveTab('reconstruct'); setProcessState(0); }}
              className={`px-3 py-1 text-[9px] uppercase font-bold rounded transition-colors flex items-center gap-1 ${activeTab === 'reconstruct' ? 'bg-pink-900/40 text-pink-400 border border-pink-500/30' : 'text-neutral-500 hover:text-white'}`}
            >
              <Rotate3D className="w-3 h-3" /> WorldMirror 2.0
            </button>
            <button 
               onClick={() => { setActiveTab('generate'); setProcessState(0); }}
              className={`px-3 py-1 flex items-center gap-1 text-[9px] uppercase font-bold rounded transition-colors ${activeTab === 'generate' ? 'bg-pink-900/40 text-pink-400 border border-pink-500/30' : 'text-neutral-500 hover:text-white'}`}
            >
              <Map className="w-3 h-3" /> HY-Pano / WorldNav
            </button>
          </div>
          <button 
            onClick={handleRun}
            disabled={isProcessing}
            className={`px-4 py-1 flex items-center gap-1.5 text-[9px] uppercase font-bold rounded transition-colors ${isProcessing ? 'bg-neutral-800 text-neutral-500 border border-neutral-700' : 'bg-pink-600/40 text-pink-300 border border-pink-500/50 hover:bg-pink-600/60 shadow-[0_0_10px_rgba(219,39,119,0.3)]'}`}
          >
            <Sparkles className="w-3 h-3" /> {isProcessing ? "Processing..." : activeTab === 'reconstruct' ? "Reconstruct 3D" : "Generate World"}
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex flex-1 gap-2 min-h-0 shrink-0">
          
          {/* Input Panel */}
          <div className="w-40 bg-[#121214] border border-pink-500/10 rounded flex flex-col shrink-0 p-2 overflow-y-auto">
             <div className="text-[8px] uppercase text-pink-500/70 font-bold mb-2 flex items-center gap-1">
               <Layers className="w-3 h-3" /> Input Pipeline
             </div>
             
             {activeTab === 'reconstruct' ? (
                <div className="space-y-2">
                  <div className="border border-dashed border-white/20 rounded p-3 flex flex-col items-center justify-center text-center gap-2 hover:bg-white/5 cursor-pointer transition-colors bg-white/5">
                    <Video className="w-5 h-5 text-white/40" />
                    <span className="text-[8px] text-white/50">Drop Video / Multi-view</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                     <label className="text-[8px] text-white/60 font-bold">Process Outputs</label>
                     <div className="grid grid-cols-2 gap-1 text-[7px]">
                       <div className="bg-pink-900/40 p-1 border border-pink-500/30 rounded text-center text-pink-300">Gaussian Splats</div>
                       <div className="bg-black/40 p-1 border border-white/10 rounded text-center text-white/60">Point Cloud</div>
                       <div className="bg-black/40 p-1 border border-white/10 rounded text-center text-white/60">Depth Map</div>
                       <div className="bg-black/40 p-1 border border-white/10 rounded text-center text-white/60">Normals</div>
                       <div className="bg-black/40 p-1 border border-white/10 col-span-2 rounded text-center text-white/60">Camera Poses</div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-white/60 font-bold">Hardware</label>
                    <select className="w-full bg-black/50 border border-white/10 rounded p-1 text-[8px] text-white/80 focus:outline-none focus:border-pink-500">
                       <option>NVIDIA Blackwell B200</option>
                       <option>NVIDIA H100 PCIe</option>
                       <option>NVIDIA A100 80GB</option>
                       <option>NVIDIA RTX 4090</option>
                    </select>
                  </div>

                  <div className="text-[7px] text-white/40 bg-black/40 p-2 rounded">
                    <strong>Model:</strong> WorldMirror 2.0 Local<br/>
                    <strong>OS:</strong> Windows / WSL Ready
                  </div>
                </div>
             ) : (
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-white/60">Text Prompt / Layout</label>
                    <textarea 
                      className="w-full bg-black/50 border border-white/10 rounded p-1.5 min-h-[60px] text-[9px] text-white/80 resize-none focus:outline-none focus:border-pink-500/50"
                      defaultValue="A futuristic city block with neon signs, rain on the pavement, cinematic lighting, ultra-high resolution"
                      spellCheck={false}
                    />
                  </div>
                  <div className="text-[7px] text-white/40 bg-black/40 p-2 rounded">
                    <strong>Model:</strong> HY-Pano-2 / WorldNav<br/>
                    <strong>Task:</strong> Panorama Generation<br/>
                    <strong>Spatial Planning:</strong> Enabled
                  </div>
                </div>
             )}
          </div>

          {/* Visualization Canvas */}
          <div className="flex-1 border border-white/10 rounded relative bg-[#050508] overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #ec4899 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
             
             {processState === 0 && (
                <div className="text-white/30 text-[10px] uppercase font-bold flex flex-col items-center gap-2">
                   <Rotate3D className="w-8 h-8 opacity-50" />
                   Ready to initialize 3D generation
                </div>
             )}

             {processState === 1 && (
                <div className="flex flex-col items-center gap-3">
                   <div className="relative w-16 h-16 flex items-center justify-center">
                     <motion.div 
                       className="absolute inset-0 border-2 border-pink-500/20 border-t-pink-500 rounded-full"
                       animate={{ rotate: 360 }}
                       transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                     />
                     <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
                   </div>
                   <div className="text-[9px] text-pink-400 uppercase tracking-widest animate-pulse">Running Diffusion Prior...</div>
                </div>
             )}

             {processState === 2 && (
                <AnimatePresence>
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="w-full h-full flex items-center justify-center relative"
                   >
                     {activeTab === 'reconstruct' ? (
                        <div className="w-full h-full perspective-1000 flex items-center justify-center">
                           {/* Simulated Point Cloud / Mesh */}
                           <motion.svg 
                             animate={{ rotateY: 360, rotateX: [10, 20, 10] }}
                             transition={{ rotateY: { duration: 20, repeat: Infinity, ease: "linear" }, rotateX: { duration: 10, repeat: Infinity, ease: "easeInOut" } }}
                             className="w-64 h-64 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]" viewBox="-50 -50 100 100"
                             style={{ transformStyle: 'preserve-3d' }}
                           >
                              {Array.from({ length: 150 }).map((_, i) => {
                                const angle = Math.random() * Math.PI * 2;
                                const radius = 20 + Math.random() * 20;
                                const y = -20 + Math.random() * 40;
                                return (
                                  <circle 
                                    key={i} 
                                    cx={Math.cos(angle) * radius} 
                                    cy={y} 
                                    r={Math.random() > 0.8 ? 1.5 : 0.8} 
                                    fill="currentColor" 
                                    className={`text-pink-${[300, 400, 500, 600][Math.floor(Math.random()*4)]}`} 
                                    opacity={0.3 + Math.random() * 0.7}
                                  />
                                )
                              })}
                              
                              <path d="M-20 -10 L20 -10 L20 10 L-20 10 Z" fill="none" stroke="rgba(236,72,153,0.4)" strokeWidth={0.5} strokeDasharray="2 2" transform="rotateUserSpace" />
                           </motion.svg>
                           <div className="absolute bottom-2 left-2 px-1.5 py-1 bg-black/60 border border-white/10 rounded text-pink-500/80 font-bold text-[8px] flex flex-col gap-0.5 backdrop-blur-md">
                             <span>Gaussian Splatting: 1.2M points</span>
                             <span>Depth Map: Aligned</span>
                           </div>
                        </div>
                     ) : (
                        <div className="w-full h-full relative p-4 flex flex-col justify-center items-center">
                           <div className="w-full h-32 bg-gradient-to-r from-cyan-900/40 via-pink-900/40 to-cyan-900/40 rounded-lg border border-pink-500/30 flex items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                              <motion.div 
                                className="w-[200%] h-full absolute opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]" 
                                animate={{ x: ['0%', '-50%'] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                              />
                              <div className="text-pink-300 font-bold uppercase tracking-widest text-[16px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10">
                                PANORAMA GENERATED
                              </div>
                           </div>
                           <div className="absolute bottom-4 left-4 right-4 flex justify-between px-2 py-1 bg-black/60 border border-white/10 rounded text-white/50 font-bold text-[8px] backdrop-blur-md">
                             <span>Model: WorldNav Routing</span>
                             <span>Format: Equirectangular</span>
                             <span>Res: 4096x2048</span>
                           </div>
                        </div>
                     )}
                   </motion.div>
                </AnimatePresence>
             )}

          </div>

        </div>

      </div>
    </div>
  );
}
