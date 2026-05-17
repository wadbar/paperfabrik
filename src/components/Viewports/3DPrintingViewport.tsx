import { Box, Download, Layers, Play, Settings } from "lucide-react";
import { motion } from "motion/react";
import { useI18n } from "../../lib/i18n";

export function ThreeDPrintingViewport() {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col font-mono text-[11px]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 bg-studio-bg rounded border border-white/5 relative flex items-center justify-center overflow-hidden">
          {/* Mock 3D Mesh */}
          <motion.svg 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="w-48 h-48 text-studio-accent/20" 
            viewBox="0 0 100 100" 
            fill="none" 
            stroke="currentColor"
          >
            <circle cx="50" cy="50" r="40" strokeWidth="0.5" strokeDasharray="2 1" />
            <circle cx="50" cy="50" r="20" strokeWidth="0.5" />
            <path d="M50 10 L50 90 M10 50 L90 50" strokeWidth="0.2" strokeOpacity="0.5"/>
            <path d="M20 20 L80 80 M80 20 L20 80" strokeWidth="0.2" strokeOpacity="0.5"/>
            <path d="M50 20 L55 30 L65 30 L60 40 L65 50 L55 50 L50 60 L45 50 L35 50 L40 40 L35 30 L45 30 Z" fill="currentColor" fillOpacity="0.1" strokeWidth="1" strokeOpacity="0.8" />
          </motion.svg>
          <div className="absolute top-2 right-2 text-[8px] text-studio-accent font-mono text-right opacity-60">
            X: 124.52<br/>Y: 82.11<br/>Z: 45.00
          </div>
        </div>

        <div className="mt-3 h-16 bg-studio-panel rounded border border-white/5 p-2 flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 bg-studio-accent/10 rounded flex items-center justify-center overflow-hidden relative">
             <motion.div 
               animate={{ y: [-10, 30] }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="w-full bg-studio-accent/40 h-1 absolute top-0"
             />
             <Layers className="w-6 h-6 text-studio-accent/40" />
          </div>
          <div className="flex-1">
            <div className="text-[9px] font-bold mb-1 opacity-80 uppercase text-white">{t("3d.gcode_gen")}</div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "37%" }}
                className="h-full bg-studio-accent"
              />
            </div>
            <div className="flex justify-between mt-1 text-[8px] font-mono opacity-50 uppercase">
              <span>{t("3d.layer")} 128/345</span>
              <span>{t("3d.support")}</span>
              <span>{t("3d.infill")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
