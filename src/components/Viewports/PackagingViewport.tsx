import { FileText, Printer, Grid, Target } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export function PackagingViewport() {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col font-mono text-[11px]">
      <div className="flex-1 bg-studio-bg rounded border border-white/5 relative p-4 flex flex-col min-h-0">
        <div className="flex-1 border border-pack-accent/20 rounded flex items-center justify-center relative overflow-hidden bg-black/40">
          <svg className="w-40 h-40 text-pack-accent/30" viewBox="0 0 100 100">
            <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M50 5 L50 95 M5 27.5 L95 27.5 M5 72.5 L95 72.5" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
            <circle cx="10" cy="10" r="1" fill="currentColor" />
            <circle cx="90" cy="10" r="1" fill="currentColor" />
            <circle cx="90" cy="90" r="1" fill="currentColor" />
            <circle cx="10" cy="90" r="1" fill="currentColor" />
          </svg>
          <div className="absolute top-2 left-2 flex gap-2">
            <span className="px-1.5 py-0.5 border border-pack-accent/40 text-[7px] text-pack-accent rounded uppercase font-bold">{t("pkg.fold")} Lines</span>
            <span className="px-1.5 py-0.5 border border-red-500/40 text-[7px] text-red-500 rounded uppercase font-bold">{t("pkg.cut")} Lines</span>
          </div>
          
          {/* Zoom Overlay */}
          <div className="absolute bottom-2 right-2 p-1 bg-studio-panel border border-white/5 text-[7px] opacity-40 uppercase">
            {t("pkg.viewport")}
          </div>
        </div>

        <div className="h-8 flex items-center justify-between mt-2 px-1 shrink-0">
           <div className="text-[8px] uppercase tracking-tighter opacity-60">
             {t("pkg.printer")}: <span className="text-white font-bold">Epson P-800 Series</span>
           </div>
           <div className="flex gap-2">
             <div className="w-3 h-3 bg-red-500/20 border border-red-500/40 rounded-sm"></div>
             <div className="w-3 h-3 bg-studio-accent/20 border border-studio-accent/40 rounded-sm"></div>
             <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/40 rounded-sm"></div>
             <div className="w-3 h-3 bg-black/20 border border-white/40 rounded-sm"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
