import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import {
  Brain,
  TrendingUp,
  Upload,
  Send,
  Loader2,
  Sparkles,
  BarChart3,
  CloudRain,
  Sun,
  Snowflake,
  Wind,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Bot,
  User,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickScenario {
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GROQ_SYSTEM_PROMPT = `You are an expert Agricultural Demand Prediction AI powered by Groq's fast inference engine.
You specialize in predicting crop demand, stock requirements, and agricultural inventory planning for Indian farmers and agri-businesses.

Your expertise includes:
- Seasonal demand patterns (Kharif, Rabi, Zaid crops)
- Weather impact on crop yields and demand
- Indian agricultural markets (APMC, mandi prices)
- Post-harvest supply chain logistics
- Regional demand variations across Indian states
- Commodity price trends (rice, wheat, pulses, vegetables, spices, etc.)
- Government procurement policies (MSP, FCI, NAFED)

When predicting demand, always provide:
1. **Predicted Demand Score** (0-100 scale, 100 = very high demand)
2. **Recommended Stock Level** (in relevant units)
3. **Confidence Level** (Low/Medium/High)
4. **Key Factors** driving demand
5. **Recommendation** (Buy More / Maintain / Reduce)
6. **Price Trend** (Rising/Stable/Falling)
7. **Best Action** (specific, actionable advice)

Format your response clearly with sections using bold headers. Be specific, data-driven, and practical.
Always consider the Indian agricultural context including seasons, festivals, and market dynamics.`;

const QUICK_SCENARIOS: QuickScenario[] = [
  {
    label: "Rice — Monsoon",
    icon: <CloudRain className="h-4 w-4" />,
    prompt: "Predict demand for Rice during Monsoon season with Rainy weather in Maharashtra. Current stock: 500 kg.",
  },
  {
    label: "Wheat — Winter",
    icon: <Snowflake className="h-4 w-4" />,
    prompt: "What is the expected demand for Wheat in Winter season in Punjab? I have 1000 kg in stock. Should I buy more before Rabi harvest?",
  },
  {
    label: "Tomatoes — Summer",
    icon: <Sun className="h-4 w-4" />,
    prompt: "Predict tomato demand for Summer season with Hot weather. Stock: 200 kg. Market: Nashik APMC.",
  },
  {
    label: "Onion — Festival",
    icon: <Sparkles className="h-4 w-4" />,
    prompt: "Predict onion demand during Diwali festival season. Weather: Normal. Region: Rajasthan. Stock: 800 kg.",
  },
  {
    label: "Pulses — Rabi",
    icon: <Wind className="h-4 w-4" />,
    prompt: "Forecast demand for Chana Dal (chickpea) in Rabi season across Madhya Pradesh. Should I increase stock levels?",
  },
];

// ─── Groq API Key ─────────────────────────────────────────────────────────────
// Set your Groq API key here OR in .env as VITE_GROQ_API_KEY
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "YOUR_GROQ_API_KEY_HERE";

// ─── Groq API (Direct — No CORS issues, Groq allows browser calls) ────────────

async function callGroqAgent(messages: { role: string; content: string }[]): Promise<string> {
  if (!GROQ_API_KEY || GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE") {
    throw new Error("Please set your Groq API key. Get one free at console.groq.com");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        { role: "system", content: GROQ_SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `Groq API error: ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response from Groq.";
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

const MessageBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm
          ${isUser ? "bg-green-500" : "bg-gradient-to-br from-purple-600 to-indigo-600"}`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
            ${isUser
              ? "bg-green-500 text-white rounded-tr-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
            }`}
          dangerouslySetInnerHTML={{
            __html: isUser
              ? msg.content
              : msg.content
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br/>")
                  .replace(/#{1,3} (.*)/g, "<span class='font-bold text-base block mt-2 mb-1'>$1</span>")
          }}
        />
        <span className="text-xs text-gray-400 px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const DemandPrediction = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hello! I'm your **AI Demand Prediction Agent** powered by Groq's ultra-fast inference.\n\nI can help you:\n• 📊 **Predict crop/product demand** based on season & weather\n• 📦 **Recommend stock levels** for your inventory\n• 💰 **Analyze price trends** in Indian agricultural markets\n• 🌾 **Plan procurement** before seasonal spikes\n\nTell me what product you want to analyze, or pick a quick scenario below!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual inputs for structured prediction
  const [product, setProduct] = useState("");
  const [season, setSeason] = useState("Monsoon");
  const [weather, setWeather] = useState("Normal");
  const [stock, setStock] = useState("");
  const [region, setRegion] = useState("");
  const [showStructured, setShowStructured] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    setTimeout(scrollToBottom, 50);

    try {
      // Build conversation history for the API
      const history = newMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await callGroqAgent(history);

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: reply, timestamp: new Date() },
      ]);
    } catch (err: any) {
      setError(err.message || "AI request failed. Please try again.");
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Sorry, I couldn't process your request right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleStructuredPredict = () => {
    if (!product) return;
    const prompt = `Predict demand for **${product}** with the following conditions:
- Season: ${season}
- Weather: ${weather}
- Current Stock: ${stock ? stock + " units" : "Not specified"}
- Region: ${region || "India (general)"}

Please provide a comprehensive demand analysis with stock recommendations.`;
    sendMessage(prompt);
    setShowStructured(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! Ask me anything about agricultural demand prediction. 🌾",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-gray-50 via-green-50/30 to-indigo-50/20 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-green-600 text-white py-6 shadow-lg">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  <Brain className="h-7 w-7" />
                </div>
                AI Demand Prediction
              </h1>
              <p className="text-indigo-200 text-sm mt-1 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Powered by Groq · Ultra-fast Agricultural Intelligence
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Groq Agent Active
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Quick Scenarios */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">Quick Scenarios</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SCENARIOS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-full text-xs text-gray-700 hover:text-indigo-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
              <button
                onClick={() => setShowStructured(!showStructured)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs transition-all shadow-sm"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Structured Input
                <ChevronDown className={`h-3 w-3 transition-transform ${showStructured ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Structured Input Panel */}
          {showStructured && (
            <div className="mb-4 bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                Structured Demand Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Product / Crop *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. Basmati Rice, Wheat"
                    value={product}
                    onChange={e => setProduct(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Season</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={season}
                    onChange={e => setSeason(e.target.value)}
                  >
                    {["Monsoon (Kharif)", "Winter (Rabi)", "Summer (Zaid)", "Festival", "Harvest"].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Weather</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={weather}
                    onChange={e => setWeather(e.target.value)}
                  >
                    {["Normal", "Hot", "Rainy", "Cold", "Dry Spell", "Flood Risk", "Cyclone"].map(w => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Current Stock (units)</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. 500"
                    type="number"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Region / State</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. Maharashtra, Punjab"
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleStructuredPredict}
                    disabled={!product || isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Predict
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Window */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-indigo-50 to-green-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Groq Demand Agent</p>
                  <p className="text-xs text-green-600">● Online · Fast Inference Mode</p>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            </div>

            {/* Messages */}
            <div className="h-[420px] overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {isLoading && (
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs text-gray-400 ml-1">Groq is analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3 mb-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 bg-gray-50">
              <div className="flex items-end gap-2">
                <textarea
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white"
                  placeholder="Ask about demand prediction for any crop, product, or market... (Enter to send)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-3 transition-colors flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 px-1">
                Shift+Enter for new line · Powered by Groq ultra-fast inference
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { icon: <Brain className="h-5 w-5 text-purple-500" />, title: "AI-Powered", desc: "Groq LLM for instant agricultural insights" },
              { icon: <TrendingUp className="h-5 w-5 text-green-500" />, title: "Market Aware", desc: "Understands Indian APMC & mandi dynamics" },
              { icon: <CheckCircle2 className="h-5 w-5 text-indigo-500" />, title: "Actionable", desc: "Get specific stock & procurement recommendations" },
            ].map(card => (
              <div key={card.title} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
                <div className="flex justify-center mb-2">{card.icon}</div>
                <p className="font-semibold text-gray-700 text-sm">{card.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DemandPrediction;