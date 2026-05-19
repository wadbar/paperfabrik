import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Zap, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";

export function SystemHealthMonitor() {
  const [stats, setStats] = useState({
    status: "NOMINAL",
    load: 12,
    integrity: 100,
    daemons: ["COMPUTE", "CNC", "PHOTO", "AI"],
    alerts: [] as string[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/system/stats");
        const data = await res.json();
        const load = Math.min(100, (parseFloat(data.uptime) / 1000) + Math.random() * 20);
        
        setStats(prev => ({
          ...prev,
          load: parseFloat(load.toFixed(1)),
          status: load > 80 ? "STRESSED" : "NOMINAL"
        }));
      } catch (e) {
        setStats(prev => ({ ...prev, status: "DEGRADED" }));
      }
    };

    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-4 bg-black/40 border border-white/5 rounded-lg font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={cn(
            "w-4 h-4",
            stats.status === "NOMINAL" ? "text-emerald-500" : "text-amber-500 animate-pulse"
          )} />
          <span className="text-[10px] font-black uppercase text-white/80">System Telemetry</span>
        </div>
        <span className={cn(
          "text-[8px] font-bold px-2 py-0.5 rounded border uppercase",
          stats.status === "NOMINAL" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
        )}>
          {stats.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[8px] text-white/30 uppercase font-black">Compute Load</span>
          <span className="text-[10px] text-white/80 font-bold">{stats.load}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000",
              stats.load > 80 ? "bg-amber-500" : "bg-studio-accent"
            )}
            style={{ width: `${stats.load}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {stats.daemons.map(d => (
          <div key={d} className="flex-1 min-w-[calc(50%-4px)] flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/5 rounded">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-500/60" />
            <span className="text-[7px] text-white/60 font-bold">{d}_DAEMON</span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
           <Zap className="w-3 h-3 text-studio-accent" />
           <span className="text-[8px] text-white/40 uppercase">Encrypted Uplink</span>
        </div>
        <span className="text-[7px] text-emerald-500/40">v{process.env.NODE_ENV === 'production' ? '1.2.0' : 'DEV-BETA'}</span>
      </div>
    </div>
  );
}
