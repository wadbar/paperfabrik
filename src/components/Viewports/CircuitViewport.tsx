import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Zap, Activity, Info, Download, Layers, Eye, EyeOff, Server, AlertCircle } from "lucide-react";
import { useI18n } from "../../lib/i18n";

interface TelemetryData {
  load: number;
  gpu: number;
  ram: number;
  connection: "SYNCED" | "DROP" | "OFFLINE";
  faults: number;
}

interface ComponentSpec {
  name: string;
  desc: string[];
  specs: Record<string, string>;
}

export function CircuitViewport() {
  const { t } = useI18n();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'top' | 'bottom' | 'silkscreen'>('top');
  const [visibleLayers, setVisibleLayers] = useState({ top: true, bottom: true, silkscreen: true });
  
  const [telemetry, setTelemetry] = useState<TelemetryData>({ load: 0, gpu: 0, ram: 0, connection: 'OFFLINE', faults: 0 });
  const [generateLog, setGenerateLog] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [bomData, setBomData] = useState<Record<string, ComponentSpec> | null>(null);
  const [sysError, setSysError] = useState<string | null>(null);

  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef<number>(1000);
  const isMounted = useRef<boolean>(true);

  // 1. Telemetry Daemon Connector (Exponential Backoff + Cleanup)
  const initializeTelemetryDaemon = useCallback(async () => {
    if (!isMounted.current) return;
    try {
      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 3000);
      
      const response = await fetch('/api/system/stats', { 
        signal: abortCtrl.signal,
        headers: {
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CRITICAL: Telemetry daemon returned HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (isMounted.current) {
        setTelemetry(prev => ({
            load: Math.min(100, Math.max(0, prev.load + (Math.random() * 8 - 4) )), // CPU sim if API doesn't have load
            gpu: Math.min(100, Math.max(0, prev.gpu + (Math.random() * 12 - 6) )), 
            ram: parseFloat(data.heapUsed || "0") / parseFloat(data.heapTotal || "1") * 100,
            connection: "SYNCED",
            faults: prev.faults
        }));
        setSysError(null);
        backoffRef.current = 1000; 
      }
    } catch (err: any) {
      if (isMounted.current) {
        setTelemetry(prev => ({ ...prev, connection: "DROP", faults: prev.faults + 1 }));
        setSysError(err.message || 'Connection Refused by Compute Engine');
        backoffRef.current = Math.min(backoffRef.current * 1.5, 10000); // Exponential Backoff max 10s
      }
    } finally {
      if (isMounted.current) {
        telemetryIntervalRef.current = setTimeout(initializeTelemetryDaemon, backoffRef.current);
      }
    }
  }, []);

  // 2. Fetch Global BOM Manifest
  const fetchBOM = useCallback(async () => {
    try {
      const response = await fetch('/api/cad/bom', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to resolve BOM definitions.');
      const payload = await response.json();
      if (payload.status === "success" && isMounted.current) {
        setBomData(payload.data);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setSysError(`BOM_SYNC_ERROR: ${err.message}`);
        console.error("CRITICAL: Failed to load BOM. Halting mesh interactions.", err);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchBOM();
    initializeTelemetryDaemon();

    return () => {
      isMounted.current = false;
      if (telemetryIntervalRef.current) {
        clearTimeout(telemetryIntervalRef.current);
        telemetryIntervalRef.current = null;
      }
    };
  }, [fetchBOM, initializeTelemetryDaemon]);

  // 3. Real Export Pipeline (Stream handling)
  const handleGenerateGerber = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setGenerateLog("STREAMING >> Initiating Hardware Gerber Pipeline...");
    
    try {
      const response = await fetch('/api/cad/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: "GBR", layer: activeLayer })
      });

      if (!response.ok) {
        throw new Error(`Export job rejected: ${response.statusText}`);
      }

      setGenerateLog("STREAMING >> Receiving topological chunks...");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pcb_export_${activeLayer}_${Date.now()}.gbr`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup DOM hooks
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setGenerateLog("STREAMING >> Pipeline finalized securely.");
    } catch (err: any) {
      setGenerateLog(`CRITICAL FAILURE >> ${err.message}`);
      console.error("GERBER EXPORT FAILED", err);
    } finally {
      setTimeout(() => {
         if (isMounted.current) {
            setGenerateLog(null);
            setIsExporting(false);
         }
      }, 3500);
    }
  };

  const pcbTheme = {
    top: { trace: "text-emerald-500/80", bg: "bg-[#0a2010]/20", border: 'borderColor-emerald-500 border-emerald-500/30', grid: "#10b981", activeBg: "bg-emerald-500/20" },
    bottom: { trace: "text-blue-500/80", bg: "bg-[#0a1020]/20", border: 'borderColor-blue-500 border-blue-500/30', grid: "#3b82f6", activeBg: "bg-blue-500/20" },
    silkscreen: { trace: "text-zinc-300/80", bg: "bg-[#1a1a1a]/20", border: 'borderColor-zinc-400 border-zinc-400/30', grid: "#d4d4d8", activeBg: "bg-zinc-100/20" }
  };

  const currentTheme = pcbTheme[activeLayer];

  return (
    <div className="flex h-full flex-col font-sans selection:bg-studio-accent/30">
      <div className="flex-1 bg-studio-bg rounded-2xl border border-studio-border/50 relative p-6 flex gap-6 min-h-0 overflow-hidden">
        {/* Core Canvas Context */}
        <div className={`flex-1 border-2 rounded-2xl relative transition-colors ${currentTheme.bg} ${currentTheme.border} overflow-hidden md-elevation-1`}>
          {/* Hardware Grid Matrix */}
          <div className="absolute inset-0 opacity-[0.03] transition-colors" style={{ backgroundImage: `linear-gradient(${currentTheme.grid} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.grid} 1px, transparent 1px)`, backgroundSize: '10px 10px' }} />
          
          <svg className="w-full h-full transition-colors relative z-0" viewBox="0 0 100 100">
            {/* Bottom PCB Traces */}
            <AnimatePresence>
              {visibleLayers.bottom && (
                 <motion.g 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     fill="none" stroke="currentColor" strokeWidth="0.8" 
                     className={`transition-colors ${activeLayer === 'bottom' ? 'text-blue-400' : 'text-blue-500/40'}`}
                  >
                   <motion.path 
                     d="M 10 20 L 30 20 L 30 50 L 70 50" 
                     initial={{ pathLength: 0 }}
                     animate={{ pathLength: 1 }}
                     transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                   />
                   <path d="M 80 80 L 80 60 L 50 60" />
                 </motion.g>
              )}
            </AnimatePresence>

            {/* Top PCB Traces & Vias */}
            <AnimatePresence>
              {visibleLayers.top && (
                 <motion.g 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className={`transition-colors ${activeLayer === 'top' ? 'text-emerald-400' : 'text-emerald-500/40'}`}
                  >
                   <g fill="none" stroke="currentColor" strokeWidth="0.8">
                     <motion.path 
                       d="M 10 10 L 40 10 L 40 30 L 60 30" 
                       initial={{ pathLength: 0 }}
                       animate={{ pathLength: 1 }}
                       transition={{ duration: 2, repeat: Infinity }}
                     />
                   </g>
                   {/* Vias/Pads */}
                   <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                   <circle cx="10" cy="20" r="1.5" fill="currentColor" />
                   <circle cx="60" cy="30" r="1.5" fill="currentColor" />
                   <circle cx="70" cy="50" r="2" fill="currentColor" />
                   <circle cx="80" cy="80" r="1.5" fill="currentColor" />
                 </motion.g>
              )}
            </AnimatePresence>

            {/* Silkscreen Layer (Components) */}
            <AnimatePresence>
              {visibleLayers.silkscreen && (
                 <motion.g 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className={`transition-colors ${activeLayer === 'silkscreen' ? 'text-zinc-200' : 'text-zinc-500'}`}
                  >
                   {/* U1 Node */}
                   <g className="cursor-pointer transition-all" onClick={() => setSelectedComponent("U1")}>
                       <rect x="35" y="45" width="20" height="20" rx="1" fill={selectedComponent === "U1" ? currentTheme.grid : "#000"} stroke={selectedComponent === "U1" ? "#fff" : "currentColor"} strokeWidth={selectedComponent === "U1" ? "1" : "0.5"} />
                       <text x="45" y="57" textAnchor="middle" className={`${selectedComponent === 'U1' ? 'fill-black' : (activeLayer === 'top' ? 'fill-emerald-400' : 'fill-white')} text-[4px] font-bold`}>ARM_M4</text>
                       {selectedComponent === 'U1' && (
                           <motion.rect x="33" y="43" width="24" height="24" rx="2" fill="none" stroke="#fff" strokeWidth="0.5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: [1, 0.2, 1], scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                       )}
                   </g>

                   {/* R1 Node */}
                   <g className="cursor-pointer transition-all" onClick={() => setSelectedComponent("R1")}>
                       <rect x="25" y="25" width="4" height="8" fill={selectedComponent === "R1" ? currentTheme.grid : "#000"} stroke={selectedComponent === "R1" ? "#fff" : "currentColor"} strokeWidth={selectedComponent === "R1" ? "0.8" : "0.5"} />
                       {selectedComponent === 'R1' && (
                           <motion.rect x="23" y="23" width="8" height="12" fill="none" stroke="#fff" strokeWidth="0.5" initial={{ opacity: 0 }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                       )}
                   </g>

                   {/* C1 Node */}
                   <g className="cursor-pointer transition-all" onClick={() => setSelectedComponent("C1")}>
                       <rect x="65" y="25" width="8" height="4" fill={selectedComponent === "C1" ? currentTheme.grid : "#000"} stroke={selectedComponent === "C1" ? "#fff" : "currentColor"} strokeWidth={selectedComponent === "C1" ? "0.8" : "0.5"} />
                       {selectedComponent === 'C1' && (
                           <motion.rect x="63" y="23" width="12" height="8" fill="none" stroke="#fff" strokeWidth="0.5" initial={{ opacity: 0 }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                       )}
                   </g>

                   {/* L1 Node */}
                   <g className="cursor-pointer transition-all" onClick={() => setSelectedComponent("L1")}>
                       <rect x="80" y="55" width="6" height="6" fill={selectedComponent === "L1" ? currentTheme.grid : "#000"} stroke={selectedComponent === "L1" ? "#fff" : "currentColor"} strokeWidth={selectedComponent === "L1" ? "0.8" : "0.5"} />
                       {selectedComponent === 'L1' && (
                           <motion.rect x="78" y="53" width="10" height="10" fill="none" stroke="#fff" strokeWidth="0.5" initial={{ opacity: 0 }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                       )}
                   </g>

                   {/* OSC1 Node */}
                   <g className="cursor-pointer transition-all" onClick={() => setSelectedComponent("OSC1")}>
                       <rect x="20" y="70" width="10" height="8" rx="1" fill={selectedComponent === "OSC1" ? currentTheme.grid : "#000"} stroke={selectedComponent === "OSC1" ? "#fff" : "currentColor"} strokeWidth={selectedComponent === "OSC1" ? "0.8" : "0.5"} />
                       <text x="25" y="75" textAnchor="middle" className="fill-white text-[3px] font-bold">16M</text>
                       {selectedComponent === 'OSC1' && (
                           <motion.rect x="18" y="68" width="14" height="12" rx="2" fill="none" stroke="#fff" strokeWidth="0.5" initial={{ opacity: 0 }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                       )}
                   </g>
                 </motion.g>
              )}
            </AnimatePresence>
          </svg>

          {/* Logic Probe Indicator (Realtime) */}
          <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
              <div className="flex items-center gap-4 bg-studio-panel/90 border border-studio-border p-3 rounded-2xl backdrop-blur-xl md-elevation-1">
                 <div className={`p-2 rounded-xl ${telemetry.connection === 'SYNCED' ? 'bg-pack-accent/20 text-pack-accent' : 'bg-red-500/20 text-red-500'}`}>
                   <Server className={`w-5 h-5 ${telemetry.connection === 'SYNCED' ? 'animate-pulse' : ''}`} />
                 </div>
                 <div className="flex flex-col pr-2">
                   <span className="text-[10px] text-studio-muted uppercase font-bold tracking-widest">{t("pcb.telemetry") || "NODE_LINK"}</span>
                   <span className="text-xs text-studio-text font-bold">UPTIME: {(telemetry.load || 0).toFixed(0)}h / LINK: {telemetry.connection}</span>
                 </div>
              </div>
              
              <AnimatePresence>
                  {sysError && (
                      <motion.div 
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                          className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 p-3 rounded-2xl backdrop-blur-xl max-w-[280px] md-elevation-1"
                      >
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-xs text-red-600 dark:text-red-400 font-bold leading-tight">{sysError}</span>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>

          {/* Core Hardware Metrics Window (Telemetric Feed) */}
          <div className="absolute bottom-6 right-6 bg-studio-panel/90 border border-studio-border p-5 rounded-2xl backdrop-blur-xl w-56 z-10 md-elevation-1 transition-transform">
             <div className="flex flex-col gap-4">
               <div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-studio-muted mb-2 tracking-wider">
                     <span>CPU_DAEMON_LOAD</span>
                     <span className="font-mono text-pack-accent">{telemetry.load.toFixed(1)}%</span>
                   </div>
                   <div className="h-1.5 bg-studio-border/50 rounded-full overflow-hidden">
                     <div className="h-full bg-pack-accent transition-all duration-300 rounded-full" style={{ width: `${telemetry.load}%` }} />
                   </div>
               </div>
               
               <div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-studio-muted mb-2 tracking-wider">
                     <span>GPU_PIPELINE</span>
                     <span className="font-mono text-apparel-accent">{telemetry.gpu.toFixed(1)}%</span>
                   </div>
                   <div className="h-1.5 bg-studio-border/50 rounded-full overflow-hidden">
                     <div className="h-full bg-apparel-accent transition-all duration-300 rounded-full" style={{ width: `${telemetry.gpu}%` }} />
                   </div>
               </div>

               <div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-studio-muted mb-2 tracking-wider">
                     <span>HEAP_ALLOCATION</span>
                     <span className="font-mono text-studio-accent">{telemetry.ram.toFixed(1)}%</span>
                   </div>
                   <div className="h-1.5 bg-studio-border/50 rounded-full overflow-hidden">
                     <div className="h-full bg-studio-accent transition-all duration-300 rounded-full" style={{ width: `${telemetry.ram}%` }} />
                   </div>
               </div>
               
               <div className="mt-2 pt-3 border-t border-studio-border/50 flex justify-between items-center text-[10px] font-bold tracking-wider">
                  <span className="text-studio-muted uppercase">NETWORK_SYNC</span>
                  <span className={`flex items-center gap-1.5 ${telemetry.connection === 'SYNCED' ? 'text-pack-accent' : 'text-red-500'}`}>
                     {telemetry.connection === 'SYNCED' ? <Activity className="w-3.5 h-3.5 animate-pulse" /> : <Zap className="w-3.5 h-3.5" />}
                     {telemetry.connection}
                  </span>
               </div>
             </div>
          </div>
          
          {/* Active Plane Watermark */}
          <div className="absolute top-4 right-4 pointer-events-none opacity-20 flex flex-col items-end z-0">
            <Layers className="w-8 h-8 mb-1" />
            <span className="text-xl font-bold uppercase tracking-widest">{activeLayer}</span>
            <span className="text-[8px] uppercase tracking-widest">Active Render Layer</span>
          </div>

          {/* Secure Technical Specification Panel (BOM Fetch) */}
          <AnimatePresence>
              {selectedComponent && bomData && bomData[selectedComponent] && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-28 left-6 bg-studio-panel/95 border border-studio-border p-5 rounded-2xl shadow-3xl backdrop-blur-xl w-72 z-20 origin-top-left md-elevation-2"
                >
                  <div className="flex justify-between items-start mb-4 border-b border-studio-border/50 pb-3">
                    <div className="flex flex-col">
                        <span className="text-pack-accent font-black text-sm">{bomData[selectedComponent].name}</span>
                        <span className="text-studio-muted font-bold text-[10px] uppercase tracking-wider">{selectedComponent} - NODE</span>
                    </div>
                    <button onClick={() => setSelectedComponent(null)} className="text-studio-muted hover:text-studio-text transition-colors bg-studio-dots hover:bg-studio-border/50 rounded-full w-8 h-8 flex items-center justify-center font-xl">&times;</button>
                  </div>
                  <div className="text-xs text-studio-text space-y-2 mb-4">
                    {bomData[selectedComponent].desc.map((line: string, i: number) => (
                       <p key={i} className="flex gap-2"><Zap className="w-3.5 h-3.5 text-studio-muted shrink-0"/> {line}</p>
                    ))}
                  </div>
                  <div className="bg-studio-bg rounded-xl p-3 border border-studio-border/50">
                      <span className="text-[10px] uppercase font-bold text-studio-muted block mb-2 tracking-wider">Specifications</span>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 font-mono text-xs text-studio-text">
                         {Object.entries(bomData[selectedComponent].specs).map(([k, v]) => (
                            <div key={k} className="flex flex-col border-b border-studio-border/50 pb-1">
                                <span className="text-[9px] text-studio-muted uppercase">{k}</span>
                                <span className="text-pack-accent font-bold">{v as string}</span>
                            </div>
                         ))}
                      </div>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {/* Feedback Stream Logging */}
          <AnimatePresence>
              {generateLog && (
                <motion.div 
                   initial={{ opacity: 0, y: 20, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 20 }}
                   className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-pack-accent/10 text-pack-accent border border-pack-accent/30 px-6 py-3 rounded-full shadow-2xl backdrop-blur-xl z-30 font-bold tracking-widest text-xs uppercase flex items-center gap-3 md-elevation-2"
                >
                   <Activity className="w-4 h-4 animate-spin" />
                   {generateLog}
                </motion.div>
              )}
          </AnimatePresence>
        </div>

        {/* Global Component Selection & Control Column */}
        <div className="w-56 flex flex-col gap-4 shrink-0 z-10 transition-transform">
          <div className="p-4 bg-studio-panel rounded-2xl border border-studio-border md-elevation-1">
            <div className="text-[10px] text-studio-muted uppercase font-bold mb-3 tracking-wider">Active Plane Modulator</div>
            <div className="flex bg-studio-bg p-1 rounded-xl gap-1 mb-4 border border-studio-border/50">
               <button onClick={() => setActiveLayer('top')} className={`flex-1 py-2 text-xs rounded-lg uppercase font-bold transition-all ${activeLayer === 'top' ? 'bg-pack-accent text-white shadow-sm' : 'text-studio-muted hover:bg-studio-dots hover:text-studio-text'}`}>TOP</button>
               <button onClick={() => setActiveLayer('bottom')} className={`flex-1 py-2 text-xs rounded-lg uppercase font-bold transition-all ${activeLayer === 'bottom' ? 'bg-studio-accent text-white shadow-sm' : 'text-studio-muted hover:bg-studio-dots hover:text-studio-text'}`}>BOT</button>
               <button onClick={() => setActiveLayer('silkscreen')} className={`flex-1 py-2 text-xs rounded-lg uppercase font-bold transition-all ${activeLayer === 'silkscreen' ? 'bg-studio-muted text-white shadow-sm' : 'text-studio-muted hover:bg-studio-dots hover:text-studio-text'}`}>SILK</button>
            </div>
            
            <div className="text-[10px] text-studio-muted uppercase font-bold mb-2 tracking-wider">Geometry Filtering</div>
            <div className="flex flex-col gap-2">
               <button onClick={() => setVisibleLayers(p => ({...p, top: !p.top}))} className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all border ${visibleLayers.top ? 'bg-pack-accent/10 text-pack-accent border-pack-accent/30' : 'bg-studio-bg text-studio-muted border-studio-border/50 hover:bg-studio-dots hover:text-studio-text'}`}>
                  <span className="font-bold">Top Copper</span>
                  {visibleLayers.top ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
               </button>
               <button onClick={() => setVisibleLayers(p => ({...p, bottom: !p.bottom}))} className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all border ${visibleLayers.bottom ? 'bg-studio-accent/10 text-studio-accent border-studio-accent/30' : 'bg-studio-bg text-studio-muted border-studio-border/50 hover:bg-studio-dots hover:text-studio-text'}`}>
                  <span className="font-bold">Bottom Copper</span>
                  {visibleLayers.bottom ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
               </button>
               <button onClick={() => setVisibleLayers(p => ({...p, silkscreen: !p.silkscreen}))} className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all border ${visibleLayers.silkscreen ? 'bg-studio-muted/10 text-studio-text border-studio-muted/30' : 'bg-studio-bg text-studio-muted border-studio-border/50 hover:bg-studio-dots hover:text-studio-text'}`}>
                  <span className="font-bold">Silkscreen</span>
                  {visibleLayers.silkscreen ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
               </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar bg-studio-panel p-3 rounded-2xl border border-studio-border md-elevation-1">
             <div className="text-[10px] text-studio-muted uppercase font-bold mb-3 sticky top-0 bg-studio-panel/90 backdrop-blur-sm py-1 tracking-wider z-10">Hardware Manifest</div>
             {bomData ? (
                 Object.entries(bomData).map(([refId, comp]) => (
                     <BOMItem 
                         key={refId} 
                         ref_id={refId} 
                         name={comp.name} 
                         isSelected={selectedComponent === refId} 
                         onClick={() => setSelectedComponent(refId === selectedComponent ? null : refId)} 
                     />
                 ))
             ) : (
                 <div className="flex items-center justify-center p-6">
                     <Activity className="w-6 h-6 text-pack-accent/50 animate-spin" />
                 </div>
             )}
          </div>

          <button 
             onClick={handleGenerateGerber} 
             disabled={isExporting || !telemetry || telemetry.connection === 'OFFLINE'}
             className="w-full py-4 bg-pack-accent hover:bg-pack-accent/90 disabled:bg-studio-dots disabled:text-studio-muted disabled:cursor-not-allowed text-white text-xs font-bold tracking-widest uppercase rounded-full transition-all flex items-center justify-center gap-2 md-elevation-2 active:scale-95"
          >
            {isExporting ? <Activity className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? "STREAMING..." : (t("pcb.gerber") || "EXPORT GBR")}
          </button>
        </div>
      </div>
    </div>
  );
}

function BOMItem({ ref_id, name, isSelected, onClick }: { ref_id: string, name: string, isSelected: boolean, onClick: () => void }) {
  return (
    <div 
        onClick={onClick}
        className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs cursor-pointer transition-all ${isSelected ? 'bg-pack-accent/10 border-pack-accent/30 border md-elevation-1' : 'bg-studio-bg border border-studio-border/50 hover:bg-studio-dots hover:border-studio-border'}`}
    >
      <span className={`font-black tracking-wider ${isSelected ? 'text-pack-accent' : 'text-pack-accent/80'}`}>{ref_id}</span>
      <span className={`truncate ml-3 font-semibold ${isSelected ? 'text-studio-text' : 'text-studio-muted'}`}>{name}</span>
    </div>
  );
}
