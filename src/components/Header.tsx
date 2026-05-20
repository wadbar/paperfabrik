import { Activity, Bell, ChevronDown, Monitor, Search, Share2, Globe, Brain, Moon, Sun } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useState, useEffect } from "react";

export function Header({ onOpenAI }: { onOpenAI?: () => void }) {
  const { language, setLanguage, t } = useI18n();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt' : 'en');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <header className="h-16 bg-studio-panel border-b border-studio-border flex items-center justify-between px-6 shrink-0 md-elevation-1">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-studio-accent rounded-full flex items-center justify-center elevation-2">
            <div className="w-4 h-4 border-[2.5px] border-white rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-studio-text">
            {t('app.title')} <span className="text-studio-accent text-xs align-top font-medium ml-1 bg-studio-accent/10 px-2 py-0.5 rounded-full">PRO v4.3</span>
          </span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium opacity-80">
          <span className="text-studio-accent font-bold">Workspace</span>
          <span className="hover:text-studio-text transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-studio-dots/50">{t('nav.libraries') || 'Libraries'}</span>
          <span className="hover:text-studio-text transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-studio-dots/50">{t('nav.machine_queue') || 'Machine Queue'}</span>
          <span className="hover:text-studio-text transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-studio-dots/50">{t('nav.cloud_sync') || 'Cloud Sync'}</span>
        </nav>
      </div>

      <div className="flex items-center gap-4 text-sm font-medium">
        <button 
           onClick={onOpenAI}
           className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full border border-purple-500/20 transition-all group"
        >
          <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>AI COMPUTE</span>
        </button>

        <button 
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full text-studio-muted hover:text-studio-text hover:bg-studio-dots transition-all"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-studio-muted hover:text-studio-text hover:bg-studio-dots transition-all"
        >
          <Globe className="w-4 h-4" />
          <span>{language === 'en' ? 'EN' : 'PT'}</span>
        </button>
        <div className="hidden sm:flex gap-2 items-center px-3 py-1.5 rounded-full bg-studio-dots">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-studio-text text-xs">4 Active</span>
        </div>
      </div>
    </header>
  );
}
