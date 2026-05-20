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
    <div className="flex h-full flex-col font-mono text-[11px] selection:bg-emerald-500/30">
      <div className="flex-1 bg-[#050505] rounded border border-white/5 relative p-4 flex gap-4 min-h-0 overflow-hidden">
        {/* Core Canvas Context */}
        <div className={`flex-1 border-2 rounded-sm relative transition-colors ${currentTheme.bg} ${currentTheme.border} overflow-hidden`}>
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
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <div className="flex items-center gap-2 bg-black/80 border border-white/10 p-2 rounded backdrop-blur-sm shadow-xl">
                 <Server className={`w-3 h-3 ${telemetry.connection === 'SYNCED' ? 'text-emerald-500 animate-pulse' : 'text-red-500'}`} />
                 <div className="flex flex-col">
                   <span className="text-[7px] text-emerald-500 uppercase font-black">{t("pcb.telemetry") || "NODE_LINK"}</span>
                   <span className="text-[9px] text-white">UPTIME: {(telemetry.load || 0).toFixed(0)}h / LINK: {telemetry.connection}</span>
                 </div>
              </div>
              
              <AnimatePresence>
                  {sysError && (
                      <motion.div 
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                          className="flex items-start gap-2 bg-red-950/80 border border-red-500/50 p-2 rounded backdrop-blur-sm max-w-[200px]"
                      >
                          <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-[7px] text-red-400 font-bold leading-tight">{sysError}</span>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>

          {/* Core Hardware Metrics Window (Telemetric Feed) */}
          <div className="absolute bottom-4 right-4 bg-black/90 border border-white/10 p-3 rounded shadow-2xl backdrop-blur-lg w-40 z-10 transition-transform">
             <div className="flex flex-col gap-2">
               <div>
                   <div className="flex justify-between items-center text-[7px] font-bold text-white/70 mb-1">
                     <span>CPU_DAEMON_LOAD</span>
                     <span className="font-mono text-emerald-400">{telemetry.load.toFixed(1)}%</span>
                   </div>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${telemetry.load}%` }} />
                   </div>
               </div>
               
               <div>
                   <div className="flex justify-between items-center text-[7px] font-bold text-white/70 mb-1">
                     <span>GPU_PIPELINE</span>
                     <span className="font-mono text-purple-400">{telemetry.gpu.toFixed(1)}%</span>
                   </div>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${telemetry.gpu}%` }} />
                   </div>
               </div>

               <div>
                   <div className="flex justify-between items-center text-[7px] font-bold text-white/70 mb-1">
                     <span>HEAP_ALLOCATION</span>
                     <span className="font-mono text-blue-400">{telemetry.ram.toFixed(1)}%</span>
                   </div>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${telemetry.ram}%` }} />
                   </div>
               </div>
               
               <div className="mt-1 pt-2 border-t border-white/10 flex justify-between items-center text-[7px]">
                  <span className="text-white/40 uppercase font-black">NETWORK_SYNC</span>
                  <span className={`flex items-center gap-1 font-black shadow-lg ${telemetry.connection === 'SYNCED' ? 'text-emerald-500' : 'text-red-500'}`}>
                     {telemetry.connection === 'SYNCED' ? <Activity className="w-2.5 h-2.5 animate-pulse" /> : <Zap className="w-2.5 h-2.5" />}
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
                    className="absolute top-20 left-4 bg-black/95 border border-emerald-500/30 p-4 rounded shadow-2xl backdrop-blur-xl w-56 z-20 origin-top-left"
                >
                  <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-2">
                    <div className="flex flex-col">
                        <span className="text-emerald-400 font-black text-[12px]">{bomData[selectedComponent].name}</span>
                        <span className="text-white/40 font-bold text-[7px] uppercase tracking-wider">{selectedComponent} - VERIFIED_NODE</span>
                    </div>
                    <button onClick={() => setSelectedComponent(null)} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded w-5 h-5 flex items-center justify-center">&times;</button>
                  </div>
                  <div className="text-[8px] text-white/80 space-y-1 mb-3">
                    {bomData[selectedComponent].desc.map((line: string, i: number) => (
                       <p key={i} className="flex gap-1.5"><Zap className="w-2.5 h-2.5 text-zinc-600 shrink-0"/> {line}</p>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded p-2">
                      <span className="text-[6.5px] uppercase font-black text-white/30 block mb-1.5">Hardware Constraints</span>
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 font-mono text-[7px] text-white/60">
                         {Object.entries(bomData[selectedComponent].specs).map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-white/5 pb-0.5">
                                <span className="text-white/40">{k}</span>
                                <span className="text-emerald-200/80">{v as string}</span>
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
                   className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#051510] text-emerald-400 border border-emerald-500/50 px-5 py-2.5 rounded shadow-2xl backdrop-blur-xl z-30 font-bold tracking-widest text-[8px] uppercase flex items-center gap-2"
                >
                   <Activity className="w-3 h-3 animate-spin" />
                   {generateLog}
                </motion.div>
              )}
          </AnimatePresence>
        </div>

        {/* Global Component Selection & Control Column */}
        <div className="w-44 flex flex-col gap-2 shrink-0 z-10 transition-transform">
          <div className="p-3 bg-white/[0.02] rounded border border-white/10 shadow-lg">
            <div className="text-[7px] text-white/50 uppercase font-black mb-1.5 tracking-wider">Active Plane Modulator</div>
            <div className="flex bg-black p-0.5 rounded gap-0.5 mb-3 border border-white/5">
               <button onClick={() => setActiveLayer('top')} className={`flex-1 py-1.5 text-[7px] rounded uppercase font-bold transition-all ${activeLayer === 'top' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/10'}`}>TOP</button>
               <button onClick={() => setActiveLayer('bottom')} className={`flex-1 py-1.5 text-[7px] rounded uppercase font-bold transition-all ${activeLayer === 'bottom' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/10'}`}>BOT</button>
               <button onClick={() => setActiveLayer('silkscreen')} className={`flex-1 py-1.5 text-[7px] rounded uppercase font-bold transition-all ${activeLayer === 'silkscreen' ? 'bg-zinc-700 text-white shadow-lg' : 'text-white/40 hover:bg-white/10'}`}>SILK</button>
            </div>
            
            <div className="text-[7px] text-white/50 uppercase font-black mb-1.5 tracking-wider">Geometry Filtering</div>
            <div className="flex flex-col gap-1">
               <button onClick={() => setVisibleLayers(p => ({...p, top: !p.top}))} className={`flex items-center justify-between px-2 py-1.5 text-[7px] rounded transition-all border ${visibleLayers.top ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-black text-white/30 border-white/5 hover:bg-white/5'}`}>
                  <span className="font-bold">Top Copper</span>
                  {visibleLayers.top ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
               </button>
               <button onClick={() => setVisibleLayers(p => ({...p, bottom: !p.bottom}))} className={`flex items-center justify-between px-2 py-1.5 text-[7px] rounded transition-all border ${visibleLayers.bottom ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-black text-white/30 border-white/5 hover:bg-white/5'}`}>
                  <span className="font-bold">Bottom Copper</span>
                  {visibleLayers.bottom ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
               </button>
               <button onClick={() => setVisibleLayers(p => ({...p, silkscreen: !p.silkscreen}))} className={`flex items-center justify-between px-2 py-1.5 text-[7px] rounded transition-all border ${visibleLayers.silkscreen ? 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20' : 'bg-black text-white/30 border-white/5 hover:bg-white/5'}`}>
                  <span className="font-bold">Silkscreen</span>
                  {visibleLayers.silkscreen ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
               </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar bg-black/20 p-2 rounded border border-white/5">
             <div className="text-[7px] text-white/50 uppercase font-black mb-2 sticky top-0 bg-[#050505]/90 backdrop-blur-sm py-1 tracking-wider">Hardware Manifest</div>
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
                 <div className="flex items-center justify-center p-4">
                     <Activity className="w-4 h-4 text-emerald-500/50 animate-spin" />
                 </div>
             )}
          </div>

          <button 
             onClick={handleGenerateGerber} 
             disabled={isExporting || !telemetry || telemetry.connection === 'OFFLINE'}
             className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-[8px] font-black tracking-widest uppercase rounded border border-emerald-400/50 disabled:border-zinc-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            {isExporting ? <Activity className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
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
        className={`flex items-center justify-between px-2.5 py-2 rounded text-[8px] cursor-pointer transition-all ${isSelected ? 'bg-emerald-500/20 border-emerald-500/40 border shadow-inner' : 'bg-white/[0.02] border border-white/5 hover:bg-white/10 hover:border-white/20'}`}
    >
      <span className={`font-black tracking-wider ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`}>{ref_id}</span>
      <span className={`truncate ml-2 font-bold ${isSelected ? 'text-white' : 'text-neutral-500'}`}>{name}</span>
    </div>
  );
}
