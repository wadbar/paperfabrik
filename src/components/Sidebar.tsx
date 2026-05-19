import { Box, Cpu, HardDrive, Maximize2, Settings, Terminal } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function Sidebar() {
  return (
    <aside className="w-12 bg-studio-panel border-r border-studio-border flex flex-col items-center py-4 gap-6 shrink-0 z-50">
      <div className="w-8 h-8 bg-studio-accent rounded flex items-center justify-center text-white font-black text-xs">
        PF
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        <SidebarItem icon={Box} active />
        <SidebarItem icon={Maximize2} />
        <SidebarItem icon={HardDrive} />
        <SidebarItem icon={Cpu} />
        <SidebarItem icon={Terminal} />
      </div>

      <div className="flex flex-col gap-4 mt-auto">
        <SidebarItem icon={Settings} />
        <div className="w-7 h-7 rounded-full bg-studio-accent/20 border border-studio-accent/30 flex items-center justify-center font-bold text-[8px] text-studio-accent">
          WB
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ icon: Icon, active }: { icon: any, active?: boolean }) {
  return (
    <div className={cn(
      "w-8 h-8 flex items-center justify-center rounded transition-all cursor-pointer",
      active ? "bg-studio-accent text-white" : "text-studio-muted hover:text-white hover:bg-white/5"
    )}>
      <Icon className="w-4 h-4" />
    </div>
  );
}
