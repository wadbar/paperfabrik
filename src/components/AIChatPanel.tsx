import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, X, Terminal, Brain, MessageSquare, Loader2 } from "lucide-react";
import { AIService, ChatMessage } from "../services/aiService";
import { cn } from "../lib/utils";
import { useI18n } from "../lib/i18n";
import ReactMarkdown from "react-markdown";

export function AIChatPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    let assistantContent = "";
    setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

    try {
      const stream = AIService.streamChat(input, messages, abortControllerRef.current.signal);
      for await (const chunk of stream) {
        assistantContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
          return newMessages;
        });
      }
    } catch (err: any) {
      if (err.message !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: "SYSTEM_ERROR: Compute connectivity lost." }]);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] bg-[var(--md-sys-color-surface)] border-l border-[var(--md-sys-color-outline-variant)] shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="h-14 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between px-6 bg-[var(--md-sys-color-surface-container)]">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--md-sys-color-on-surface)]">Compute Assistant</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase font-bold">L-0 System Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[var(--md-sys-color-surface-container-high)] rounded-full transition-colors text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--md-sys-color-outline-variant)]"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <Terminal className="w-12 h-12 text-[var(--md-sys-color-on-surface-variant)]" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Awaiting Instructions</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Compute v3.2.1-stable initialized</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col gap-2",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[var(--md-sys-color-on-surface-variant)]">
                    {msg.role === 'user' ? (
                      <>COMMAND <div className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)]" /></>
                    ) : (
                      <><div className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-secondary)]" /> COMPUTE_OUT</>
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" 
                      : "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
                  )}>
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.content === "" && isTyping && (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--md-sys-color-on-surface)] opacity-50" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Query Compute (e.g. Export STL optimization...)"
                  className="m3-input pr-12 text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)] disabled:opacity-30 disabled:hover:bg-transparent transition-all rounded-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <div className="flex justify-between items-center mt-3 px-1">
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest font-bold">Connection: Direct Streaming TLS</span>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest font-bold">Tokens: 0 / 128k</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
