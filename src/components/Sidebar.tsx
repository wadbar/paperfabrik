import { Box, Cpu, HardDrive, Maximize2, Settings, Terminal } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function Sidebar() {
  return (
    <aside className="w-16 md:w-20 bg-studio-panel border-r border-studio-border flex flex-col items-center py-6 gap-8 shrink-0 z-50">
      <div className="w-10 h-10 bg-studio-accent rounded-xl flex items-center justify-center text-white font-black text-sm elevation-1">
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
        <div className="w-10 h-10 rounded-full bg-studio-accent/20 border border-studio-accent/30 flex items-center justify-center font-bold text-xs text-studio-accent hover:bg-studio-accent/30 transition-colors cursor-pointer">
          WB
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ icon: Icon, active }: { icon: any, active?: boolean }) {
  return (
    <div className={cn(
      "w-12 h-12 flex items-center justify-center rounded-2xl transition-all cursor-pointer relative group",
      active ? "bg-studio-accent/20 text-studio-accent" : "text-studio-muted hover:text-studio-text hover:bg-studio-dots"
    )}>
      {active && <div className="absolute inset-0 bg-studio-accent opacity-10 rounded-2xl" />}
      <Icon className={cn("w-6 h-6", active && "scale-110")} />
    </div>
  );
}
