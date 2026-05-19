import React from "react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { LucideIcon } from "lucide-react";
import { useTelemetry } from "@/src/hooks/useTelemetry";

interface FabricationPanelProps {
  id_num: string;
  title: string;
  filename: string;
  icon: LucideIcon;
  accentColor: string;
  accentBg: string;
  className?: string;
  children: React.ReactNode;
  actionText?: string;
}

export function FabricationPanel({
  id_num,
  title,
  filename,
  icon: Icon,
  accentColor,
  accentBg,
  className,
  children,
  actionText,
}: FabricationPanelProps) {
  const { recordEvent } = useTelemetry(`PANEL_${id_num}`);

  const handleAction = () => {
    recordEvent("USER_ACTION_EXECUTE", { title, action: actionText });
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseEnter={() => recordEvent("PANEL_FOCUS_GAIN")}
      className={cn(
        "bg-[#0a0a0b] relative flex h-full overflow-hidden border border-transparent hover:border-studio-border/30 transition-colors",
        className
      )}
    >
      {/* Side Icon Strip */}
      <div className="w-12 border-r border-studio-dots flex flex-col items-center py-4 gap-4 opacity-70 shrink-0">
        <div className={cn("p-2 rounded-md border", accentBg, accentColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div 
          onClick={() => recordEvent("TOOL_ACCESS", { tool: "LINE_PATH" })}
          className="p-2 text-studio-muted hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <div className="flex justify-between items-center mb-2 shrink-0">
          <h2 className={cn("text-[11px] font-bold uppercase tracking-widest flex items-center gap-2", accentColor)}>
            {id_num}. {title} 
            <span className="text-[9px] opacity-40 font-normal italic lowercase">{filename}</span>
          </h2>
          {actionText && (
            <button 
              onClick={handleAction}
              className={cn("px-2 py-1 text-[9px] font-bold rounded uppercase transition-colors shrink-0", 
              id_num === "01" ? "bg-studio-accent hover:bg-blue-500 text-white" : 
              id_num === "03" ? "bg-emerald-700 hover:bg-emerald-600 text-white" :
              id_num === "04" ? "bg-fuchsia-700 hover:bg-fuchsia-600 text-white" : 
              "border border-amber-500/50 text-amber-500")}>
              {actionText}
            </button>
          )}
        </div>
        
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    </motion.section>
  );
}
