import { Activity, Bell, ChevronDown, Monitor, Search, Share2, Globe, Brain, Moon, Sun } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useState, useEffect } from "react";

export function Header({ onOpenAI }: { onOpenAI?: () => void }) {
  const { language, setLanguage, t } = useI18n();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark'); // Keep this for tailwind class compatibility if needed.
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
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
    <header className="h-16 lg:h-20 bg-[var(--md-sys-color-surface)] flex items-center justify-between px-4 sm:px-6 shrink-0 border-b border-[var(--md-sys-color-outline-variant)]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--md-sys-color-primary-container)] rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 border-[3px] border-[var(--md-sys-color-on-primary-container)] rotate-45 rounded-sm"></div>
          </div>
          <span className="text-xl lg:text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] hidden sm:block">
            {t('app.title')} <span className="text-[var(--md-sys-color-primary)] text-xs align-top font-bold ml-1 bg-[var(--md-sys-color-primary-container)] px-2 py-0.5 rounded-full">PRO v4.3</span>
          </span>
        </div>
        <nav className="hidden md:flex gap-2 text-sm font-medium">
          <button className="text-[var(--md-sys-color-on-surface)] font-bold px-4 py-2 bg-[var(--md-sys-color-surface-container-high)] rounded-full transition-colors">Workspace</button>
          <button className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] px-4 py-2 rounded-full transition-colors">{t('nav.libraries') || 'Libraries'}</button>
          <button className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] px-4 py-2 rounded-full transition-colors">{t('nav.machine_queue') || 'Machine Queue'}</button>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
        <button 
           onClick={onOpenAI}
           className="flex items-center gap-2 bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] px-5 py-2.5 rounded-full transition-all group md-elevation-1 hover:md-elevation-2 active:scale-95"
        >
          <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">AI COMPUTE</span>
        </button>

        <button 
          onClick={toggleTheme}
          className="w-12 h-12 flex items-center justify-center rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-all"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button 
          onClick={toggleLanguage}
          className="w-12 h-12 sm:w-auto sm:px-4 sm:h-12 flex items-center justify-center gap-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-all"
        >
          <Globe className="w-5 h-5" />
          <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'PT'}</span>
        </button>
      </div>
    </header>
  );
}
