import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Trash2, Download } from "lucide-react";
import { logger, LogEntry } from "../core/logger";

export function TerminalOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentLogs = logger.getLogs();
      if (currentLogs.length !== logs.length) {
          setLogs(currentLogs);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [logs.length]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-10 right-4 z-[100] p-2 bg-[#0a0a0b] border border-white/10 rounded-full text-white/40 hover:text-blue-400 hover:border-blue-500/50 transition-all shadow-xl backdrop-blur-md"
      >
        <TerminalIcon className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                width: isMaximized ? "calc(100% - 2rem)" : "400px",
                height: isMaximized ? "calc(100% - 6rem)" : "300px"
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-[100] bg-[#0a0a0b]/95 border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Terminal Header */}
            <div className="h-8 bg-white/5 border-b border-white/5 flex items-center justify-between px-3 shrink-0 select-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-2">System Telemetry Console</span>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => setIsMaximized(!isMaximized)} className="text-white/20 hover:text-white transition-colors">
                    {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                 </button>
                 <button onClick={() => setLogs([])} className="text-white/20 hover:text-white transition-colors">
                    <Trash2 className="w-3 h-3" />
                 </button>
                 <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                 </button>
              </div>
            </div>

            {/* Log View */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 font-mono text-[10px] leading-relaxed selection:bg-blue-500/30"
            >
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <div className="text-white/10 uppercase tracking-[0.2em] font-black text-center">
                            Listening for compute events
                        </div>
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="mb-1 group border-b border-white/2 pb-1 last:border-0">
                            <span className="text-white/20">[{new Date(log.timestamp).toLocaleTimeString()}] </span>
                            <span className={`font-bold ${
                                log.level === "ERROR" ? "text-red-400" : 
                                log.level === "WARN" ? "text-yellow-400" : 
                                "text-blue-400"
                            }`}>{log.level}</span>
                            <span className="text-emerald-400/80"> @{log.module}</span>
                            <span className="text-white/70">: {log.message}</span>
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="pl-4 text-white/20 text-[9px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {JSON.stringify(log.metadata)}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="h-6 bg-white/2 border-t border-white/5 flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-[7px] text-white/20 uppercase">Status: Connected</span>
                    <span className="text-[7px] text-white/20 uppercase">Buffer: {logs.length}/100</span>
                </div>
                <div className="flex items-center gap-2">
                    <Download className="w-2.5 h-2.5 text-white/20 cursor-pointer hover:text-white" />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
