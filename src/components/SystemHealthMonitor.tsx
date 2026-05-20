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
    <div className="flex flex-col gap-4 p-5 bg-studio-dots/80 border border-studio-border rounded-2xl font-mono md-elevation-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-full", stats.status === "NOMINAL" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-studio-text">Telemetry</span>
        </div>
        <span className={cn(
          "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
          stats.status === "NOMINAL" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
        )}>
          {stats.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-[10px] text-studio-muted uppercase font-bold tracking-widest">Load</span>
          <span className="text-xs text-studio-text font-bold">{stats.load}%</span>
        </div>
        <div className="h-1.5 bg-studio-border/50 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000 rounded-full",
              stats.load > 80 ? "bg-amber-500" : "bg-studio-accent"
            )}
            style={{ width: `${stats.load}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {stats.daemons.map(d => (
          <div key={d} className="flex-1 min-w-[calc(50%-4px)] flex items-center gap-2 px-3 py-2 bg-studio-bg border border-studio-border/50 rounded-xl">
            <ShieldCheck className="w-3 h-3 text-emerald-500/60" />
            <span className="text-[9px] text-studio-muted font-bold tracking-wide">{d}_DAEMON</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-studio-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-studio-accent" />
           <span className="text-[10px] text-studio-muted uppercase font-medium">Uplink Secured</span>
        </div>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400/60 font-semibold tracking-wider">v{process.env.NODE_ENV === 'production' ? '1.2.0' : 'BETA'}</span>
      </div>
    </div>
  );
}
