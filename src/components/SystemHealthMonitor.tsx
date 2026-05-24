import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Zap, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { logger } from "../core/logger";

export const SystemHealthMonitor = React.memo(() => {
  const [stats, setStats] = useState({
    status: "NOMINAL",
    load: 12,
    integrity: 100,
    daemons: ["COMPUTE", "CNC", "PHOTO", "AI"],
    alerts: [] as string[]
  });
  
  const [history, setHistory] = useState<{time: number, load: number, ram: number}[]>([]);
  
  const [criticalTicks, setCriticalTicks] = useState(0);
  const [memoryCriticalTicks, setMemoryCriticalTicks] = useState(0);

  useEffect(() => {
    const fetchStats = () => {
      try {
        let load = 0;
        let ram = 0;

        // Use real Performance API where available
        if (typeof performance !== 'undefined' && (performance as any).memory) {
            const mem = (performance as any).memory;
            ram = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
        }

        // Generic CPU proxy using requestAnimationFrame delta
        const t0 = performance.now();
        requestAnimationFrame(() => {
            const t1 = performance.now();
            const delta = t1 - t0;
            // Assuming 16.6ms is baseline for 60fps. Any delay implies thread block (load).
            load = Math.min(100, Math.max(0, (delta - 16.6) * 5));
            
            setStats(prev => ({
              ...prev,
              load: parseFloat(load.toFixed(1)),
              status: (load > 80 || ram > 80) ? "STRESSED" : "NOMINAL"
            }));
            
            setHistory(prev => {
              const baseTime = prev.length > 0 ? prev[prev.length - 1].time : 0;
              const next = [...prev, { time: baseTime + 1, load, ram }];
              if (next.length > 20) return next.slice(1);
              return next;
            });

            if (load > 85 || ram > 85) {
              setCriticalTicks(prev => prev + 1);
            } else {
              setCriticalTicks(0);
            }

            if (ram > 90) {
              setMemoryCriticalTicks(prev => {
                const next = prev + 1;
                if (next === 3) {
                  logger.warn("SYSTEM_HEALTH", `HIGH_MEMORY_USAGE: Heap usage exceeded 90%`, { ram: ram.toFixed(2) });
                }
                return next;
              });
            } else {
              setMemoryCriticalTicks(0);
            }
        });

      } catch (e) {
        setStats(prev => ({ ...prev, status: "DEGRADED" }));
      }
    };

    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl font-mono md-elevation-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-full", stats.status === "NOMINAL" ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">Telemetry</span>
        </div>
        <span className={cn(
          "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
          stats.status === "NOMINAL" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
        )}>
          {stats.status}
        </span>
      </div>

      <div className="space-y-3">
        {criticalTicks > 150 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-red-500 font-bold leading-tight">CRITICAL THRESHOLD BREACHED: SYSTEM LOAD &gt; 85% FOR OVER 5 MIN</span>
          </div>
        )}
        {memoryCriticalTicks >= 3 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-[10px] text-amber-500 font-bold leading-tight">CRITICAL THRESHOLD BREACHED: HEAP USAGE &gt; 90%</span>
          </div>
        )}
        <div className="flex justify-between items-end">
          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-bold tracking-widest">Load & RAM</span>
          <span className="text-xs text-[var(--md-sys-color-on-surface)] font-bold">{stats.load.toFixed(1)}%</span>
        </div>
        
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--md-sys-color-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--md-sys-color-primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: 'var(--md-sys-color-on-surface)' }}
                labelStyle={{ display: 'none' }}
              />
              <Area type="monotone" dataKey="load" stroke="var(--md-sys-color-primary)" fillOpacity={1} fill="url(#colorLoad)" isAnimationActive={false} />
              <Area type="monotone" dataKey="ram" stroke="#10b981" fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {stats.daemons.map(d => (
          <div key={d} className="flex-1 min-w-[calc(50%-4px)] flex items-center gap-2 px-3 py-2 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-xl">
            <ShieldCheck className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
            <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] font-bold tracking-wide">{d}_DAEMON</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
           <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-medium">Uplink Secured</span>
        </div>
        <span className="text-[10px] text-[var(--md-sys-color-primary)] font-semibold tracking-wider">v{process.env.NODE_ENV === 'production' ? '1.2.0' : 'BETA'}</span>
      </div>
    </div>
  );
});

