import { useState, useRef, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = [
  'How do I treat fungal disease on wheat?',
  'Best time to plant cotton in Maharashtra?',
  'Tell me about PM-KISAN scheme',
  'How to improve soil fertility naturally?',
];

const GREETING = "Namaste! I'm AgriBot 🌾 — your AI farming assistant. Ask me anything about crops, soil, pests, irrigation, or government schemes!";

const FarmerChatbot = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING }
  ]);
  const [apiHistory, setApiHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text?: string) => {
    const userMessage = text || input.trim();
    if (!userMessage || isLoading) return;

    const userMsg: Message = { role: 'user', content: userMessage };
    const newApiHistory = [...apiHistory, userMsg];

    setMessages(prev => [...prev, userMsg]);
    setApiHistory(newApiHistory);
    setInput('');
    setIsLoading(true);
    inputRef.current?.focus();

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newApiHistory.slice(-10) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Chat failed');

      const assistantMsg: Message = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMsg]);
      setApiHistory(prev => [...prev, assistantMsg]);
    } catch (e: unknown) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I'm having trouble connecting. ${e.message || 'Please try again.'}`,
      }]);
    }
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: GREETING }]);
    setApiHistory([]);
    inputRef.current?.focus();
  };

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        {/* Header */}
        <div className="bg-gradient-hero text-primary-foreground py-6">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-7 w-7" /> AgriBot — AI Farming Assistant
              </h1>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Powered by Groq AI • Ask about crops, soil, schemes & more
              </p>
            </div>
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-white/30 text-white hover:bg-white/20 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {/* Chat Window */}
          <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden" style={{ height: '62vh' }}>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth">
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={i}
                    className={`flex items-end gap-2.5 transition-all duration-300 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                    style={{
                      animation: 'fadeSlideIn 0.25s ease-out both',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform duration-200 hover:scale-105 ${
                        isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary border border-border'
                      }`}
                    >
                      {isUser
                        ? <User className="h-3.5 w-3.5" />
                        : <Bot className="h-3.5 w-3.5 text-primary" />
                      }
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-secondary text-foreground rounded-bl-none border border-border/50'
                      }`}
                    >
                      {msg.content.split('\n').map((line, j) => (
                        <span key={j}>
                          {line}
                          {j < msg.content.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div
                  className="flex items-end gap-2.5 flex-row"
                  style={{ animation: 'fadeSlideIn 0.2s ease-out both' }}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shadow-sm">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-secondary border border-border/50 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                          style={{
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '0.8s',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* Input Area */}
            <div className="px-4 py-3 bg-card">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about farming, crops, schemes..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 shadow-sm"
                >
                  {isLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Starter Suggestions */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2.5 font-medium">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={isLoading}
                  className="text-xs px-3.5 py-1.5 bg-card border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inline keyframe animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
};

export default FarmerChatbot;