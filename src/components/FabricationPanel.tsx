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

export const FabricationPanel = React.memo(({
  id_num,
  title,
  filename,
  icon: Icon,
  accentColor,
  accentBg,
  className,
  children,
  actionText,
}: FabricationPanelProps) => {
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
        "bg-[var(--md-sys-color-surface-container)] relative flex h-full overflow-hidden m3-card",
        className
      )}
    >
      {/* Side Icon Strip */}
      <div className="w-16 border-r border-[var(--md-sys-color-outline-variant)] flex flex-col items-center py-6 gap-6 shrink-0 bg-[var(--md-sys-color-surface-container-high)]">
        <div className={cn("p-3 rounded-2xl md-elevation-1", accentBg, accentColor)}>
          <Icon className="w-6 h-6" />
        </div>
        <div 
          onClick={() => recordEvent("TOOL_ACCESS", { tool: "LINE_PATH" })}
          className="p-3 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] rounded-xl transition-all cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-3 text-[var(--md-sys-color-on-surface)]">
            {title} 
            <span className="hidden sm:inline-block text-sm text-[var(--md-sys-color-on-surface-variant)] font-normal tracking-wide px-3 py-1 bg-[var(--md-sys-color-surface-container-high)] rounded-full">{filename}</span>
          </h2>
          {actionText && (
            <button 
              onClick={handleAction}
              className={cn("text-xs md:text-sm shrink-0", 
              id_num === "01" ? "m3-button-filled" : 
              "m3-button-tonal")}>
              {actionText}
            </button>
          )}
        </div>
        
        <div className="flex-1 min-h-0 bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
          {children}
        </div>
      </div>
    </motion.section>
  );
});

