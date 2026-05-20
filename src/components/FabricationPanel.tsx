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
        "bg-studio-panel relative flex h-full overflow-hidden border border-studio-border/50",
        className
      )}
    >
      {/* Side Icon Strip */}
      <div className="w-16 border-r border-studio-border/50 flex flex-col items-center py-6 gap-6 shrink-0 bg-studio-bg/50">
        <div className={cn("p-3 rounded-2xl md-elevation-1", accentBg, accentColor)}>
          <Icon className="w-6 h-6" />
        </div>
        <div 
          onClick={() => recordEvent("TOOL_ACCESS", { tool: "LINE_PATH" })}
          className="p-3 text-studio-muted hover:text-studio-text hover:bg-studio-dots rounded-xl transition-all cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className={cn("text-lg font-bold flex items-center gap-3", accentColor)}>
            {title} 
            <span className="text-sm text-studio-muted font-normal tracking-wide px-3 py-1 bg-studio-dots rounded-full">{filename}</span>
          </h2>
          {actionText && (
            <button 
              onClick={handleAction}
              className={cn("px-6 py-2 text-sm font-semibold rounded-full uppercase transition-all md-elevation-1 hover:md-elevation-2 active:scale-95 shrink-0", 
              id_num === "01" ? "bg-studio-accent text-white" : 
              id_num === "03" ? "bg-pack-accent text-white" :
              id_num === "04" ? "bg-apparel-accent text-white" : 
              "border-2 border-wood-accent text-wood-accent hover:bg-wood-accent hover:text-white")}>
              {actionText}
            </button>
          )}
        </div>
        
        <div className="flex-1 min-h-0 bg-studio-bg rounded-2xl border border-studio-border/50 overflow-hidden">
          {children}
        </div>
      </div>
    </motion.section>
  );
}
