import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Settings2, Activity, Clock } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { logger } from "../../core/logger";

export const CNCRouterViewport = React.memo(() => {
  const { t } = useI18n();
  const [machiningTime, setMachiningTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const totalEstimatedTime = 240; // 4 minutes

  useEffect(() => {
    let interval: NodeJS.Timeout;
    try {
      if (isSimulating) {
        interval = setInterval(() => {
          setMachiningTime((prev) => {
            const nextTime = prev + 1;
            setProgress(Math.min((nextTime / totalEstimatedTime) * 100, 100));
            
            if (nextTime >= totalEstimatedTime) {
              clearInterval(interval);
              setIsSimulating(false);
              logger.info("CNC_ROUTER", "Machining simulation completed successfully");
            }
            return nextTime;
          });
        }, 1000);
      }
    } catch (e) {
      logger.error("CNC_ROUTER", "Error during simulation interval", e as Error);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, totalEstimatedTime]);

  const handleToggleSimulation = () => {
    try {
      if (!isSimulating && progress >= 100) {
        setMachiningTime(0);
        setProgress(0);
      }
      setIsSimulating((prev) => {
        logger.info("CNC_ROUTER", `Machining simulation ${!prev ? 'started' : 'paused'}`, { currentProgress: progress });
        return !prev;
      });
    } catch (e) {
      logger.error("CNC_ROUTER", "Error toggling simulation", e as Error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-amber-500/30">
      <div className="flex-1 bg-studio-bg rounded border border-white/5 relative p-4 flex gap-4 min-h-0 overflow-hidden">
        {/* CNC Bed / Spoilboard Visualization */}
        <div className="flex-1 border border-wood-accent/20 flex flex-col items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-80 overflow-hidden rounded-sm">
           {/* Tool Path Area */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#f59e0b 0.5px, transparent 0.5px), linear-gradient(90deg, #f59e0b 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
           
           <svg className="w-5/6 h-5/6 text-wood-accent/50 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]" viewBox="0 0 100 100" fill="none" stroke="currentColor">
              {/* Nested Parts for CNC Routing */}
              <rect x="5" y="5" width="25" height="25" rx="1" strokeWidth="0.5" strokeDasharray="1" />
              <rect x="35" y="5" width="25" height="25" rx="1" strokeWidth="0.5" strokeDasharray="1" />
              <path d="M65 5 L95 5 L95 30 L65 30 Z" strokeWidth="0.5" strokeDasharray="1" />
              
              {/* Computed Tool Path (Profiling) */}
              {isSimulating && (
                 <>
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
                 </>
              )}

              <text x="50" y="90" className="fill-wood-accent text-[4px] uppercase font-bold tracking-widest text-center" textAnchor="middle">
                ROUTER_BED_V4: 1200mm x 2400mm
              </text>
           </svg>

           {/* Real-time Progress Simulation Bar */}
           <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm p-2 flex flex-col gap-1">
             <div className="flex justify-between items-center text-[7px] uppercase font-bold text-wood-accent/80">
               <span className="flex items-center gap-1"><Clock className="w-2 h-2" /> G-CODE ESTIMATE vs ACTUAL</span>
               <span>{formatTime(machiningTime)} / {formatTime(totalEstimatedTime)}</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                <motion.div 
                  className="absolute top-0 bottom-0 left-0 bg-wood-accent shadow-[0_0_8px_#f59e0b]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.5 }}
                />
             </div>
             <div className="flex justify-between items-center text-[6px] text-white/40 uppercase font-black tracking-widest">
                <span>0% START</span>
                <span className="text-wood-accent/60">{progress.toFixed(1)}% COMPLETE</span>
                <span>100% DONE</span>
             </div>
           </div>

           <div className="absolute top-2 left-2 flex gap-2">
             <div className="px-1.5 py-0.5 bg-wood-accent/10 border border-wood-accent/30 text-[7px] text-wood-accent rounded uppercase font-bold">{t("cnc.tool")} 1/4"</div>
             <div className="px-1.5 py-0.5 bg-black/40 border border-white/10 text-[7px] text-white/60 rounded uppercase font-bold">{t("cnc.offset")}</div>
           </div>
        </div>
        
        {/* Machining Parameters */}
        <div className="w-36 flex flex-col gap-2 shrink-0">
          <div className="p-2 bg-wood-accent/5 rounded border border-wood-accent/20 group hover:border-wood-accent/50 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[7px] text-wood-accent uppercase font-black">{t("cnc.spindle")} Load</span>
              <Activity className={`w-2 h-2 text-wood-accent ${isSimulating ? 'animate-pulse' : ''}`} />
            </div>
            <div className="text-[12px] text-white font-black italic">{isSimulating ? '18,500' : '0'} <span className="text-[8px] font-normal not-italic opacity-40">RPM</span></div>
            <div className="h-1 w-full bg-white/5 rounded-full mt-1 overflow-hidden transition-all duration-300">
              <div className={`h-full bg-wood-accent ${isSimulating ? 'w-2/3' : 'w-0'} transition-all duration-500`} />
            </div>
          </div>

          <div className="p-2 bg-black/20 rounded border border-white/5">
            <div className="text-[7px] text-stone-500 uppercase font-black">{t("cnc.feed")} Rate</div>
            <div className="text-[10px] text-white font-medium">{isSimulating ? '4,200' : '0'} <span className="text-[7px] opacity-40">mm/min</span></div>
          </div>

          <div className="p-2 bg-black/20 rounded border border-white/5">
            <div className="text-[7px] text-stone-500 uppercase font-black">{t("cnc.plunge")}</div>
            <div className="text-[10px] text-white font-medium">{isSimulating ? '800' : '0'} <span className="text-[7px] opacity-40">mm/min</span></div>
          </div>

          <div className="mt-auto space-y-1">
             <button 
               onClick={handleToggleSimulation}
               className={`w-full flex items-center justify-between px-2 py-1.5 transition-all text-[8px] font-bold uppercase rounded-sm ${
                 isSimulating 
                  ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white' 
                  : 'bg-wood-accent/10 border border-wood-accent/30 text-wood-accent hover:bg-wood-accent hover:text-white'
               }`}>
               {isSimulating ? 'PAUSE JOB' : t("cnc.run_job")} <Play className="w-2 h-2" />
             </button>
             <button className="w-full flex items-center justify-between px-2 py-1 bg-studio-panel border border-studio-border text-stone-500 hover:text-white transition-all text-[8px] font-bold uppercase rounded-sm">
               {t("nav.settings")} <Settings2 className="w-2 h-2" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
});
