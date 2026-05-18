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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    let assistantContent = "";
    setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

    try {
      const stream = AIService.streamChat(input, messages);
      for await (const chunk of stream) {
        assistantContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
          return newMessages;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "SYSTEM_ERROR: Kernel connectivity lost." }]);
    } finally {
      setIsTyping(false);
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
            className="fixed top-0 right-0 bottom-0 w-[400px] bg-[#0d0d0f] border-l border-white/5 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Kernel Assistant</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-emerald-500/80 uppercase font-bold">L-0 System Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <Terminal className="w-12 h-12" />
                  <div className="space-y-1">
                    <p className="text-xs uppercase font-black tracking-tighter">Awaiting Fabrication Instructions</p>
                    <p className="text-[10px] uppercase">Kernel v3.2.1-stable initialized</p>
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
                  <div className="flex items-center gap-2 text-[8px] uppercase font-black tracking-widest text-white/30">
                    {msg.role === 'user' ? (
                      <>COMMAND <div className="w-1 h-1 rounded-full bg-blue-500" /></>
                    ) : (
                      <><div className="w-1 h-1 rounded-full bg-purple-500" /> KERNEL_OUT</>
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[90%] px-4 py-3 rounded-lg text-xs leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-blue-500/10 border border-blue-500/20 text-blue-100" 
                      : "bg-white/5 border border-white/10 text-white/90"
                  )}>
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.content === "" && isTyping && (
                      <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/5 bg-black/20">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Query Kernel (e.g. Export STL optimization...)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all uppercase tracking-tight"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-purple-500/20 text-purple-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all rounded-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex justify-between items-center mt-3 px-1">
                <span className="text-[7px] text-white/20 uppercase tracking-widest">Protocol: Direct Streaming TLS</span>
                <span className="text-[7px] text-white/20 uppercase tracking-widest">Tokens: 0 / 128k</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
