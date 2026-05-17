import { Activity, Bell, ChevronDown, Monitor, Search, Share2 } from "lucide-react";

export function Header() {
  return (
    <header className="h-12 bg-studio-panel border-b border-studio-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-studio-accent rounded flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-white rotate-45"></div>
          </div>
          <span className="text-lg font-black tracking-tighter text-white uppercase">
            FABRIK STUDIO <span className="text-studio-accent text-[10px] align-top font-normal ml-1">PRO v4.2</span>
          </span>
        </div>
        <nav className="flex gap-4 text-[10px] uppercase tracking-widest font-bold opacity-60">
          <span className="text-studio-accent">Workspace</span>
          <span className="hover:text-white transition-colors cursor-pointer">Libraries</span>
          <span className="hover:text-white transition-colors cursor-pointer">Machine Queue</span>
          <span className="hover:text-white transition-colors cursor-pointer">Cloud Sync</span>
        </nav>
      </div>

      <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-white/80">4 Machines Active</span>
        </div>
        <div className="h-4 w-[1px] bg-studio-border"></div>
        <span className="opacity-50">14:28:45</span>
      </div>
    </header>
  );
}
