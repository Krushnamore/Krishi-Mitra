import { useState, useRef, useEffect } from 'react';
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
  // Display messages (includes greeting for UI)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING }
  ]);
  // Only actual conversation turns sent to API (no greeting)
  const [apiHistory, setApiHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const userMessage = text || input.trim();
    if (!userMessage || isLoading) return;

    const userMsg: Message = { role: 'user', content: userMessage };
    const newApiHistory = [...apiHistory, userMsg];

    setMessages(prev => [...prev, userMsg]);
    setApiHistory(newApiHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newApiHistory.slice(-10) }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Chat failed');
      }

      const assistantMsg: Message = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMsg]);
      setApiHistory(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        role: 'assistant',
        content: `Sorry, I'm having trouble connecting. ${e.message || 'Please try again.'}`,
      };
      setMessages(prev => [...prev, errMsg]);
    }
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: GREETING }]);
    setApiHistory([]);
  };

  return (
    <Layout>
      <div className="bg-secondary min-h-screen">
        <div className="bg-gradient-hero text-primary-foreground py-6">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-7 w-7" /> AgriBot — AI Farming Assistant
              </h1>
              <p className="text-primary-foreground/80 text-sm mt-1">Powered by Groq AI • Ask about crops, soil, schemes & more</p>
            </div>
            <Button variant="outline" size="sm" onClick={clearChat}
              className="border-white/30 text-white hover:bg-white/20">
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <div className="bg-card rounded-2xl border border-border flex flex-col" style={{ height: '60vh' }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-2 rounded-full flex-shrink-0 ${msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
                    {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'assistant'
                      ? 'bg-secondary text-foreground rounded-tl-sm'
                      : 'bg-primary text-primary-foreground rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about farming, crops, schemes..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="sm" className="px-4">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 bg-card border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FarmerChatbot;