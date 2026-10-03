import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, RefreshCw, Zap, Shield, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';
import { useNavigate } from 'react-router-dom';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; tools?: string[]; actionStaged?: boolean }>>([
    {
      role: 'assistant',
      content:
        "Hello! I am PayPilot's AI Revenue Operations Agent. I analyze your real-time PayPal transactions, identify revenue at risk, and prepare permission-controlled recovery strategies. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Why is my revenue at risk?',
    'Show me customers whose payment behavior has deteriorated',
    'What changed with Alex Technologies?',
    'Prepare recovery actions for customers overdue by more than 3 days',
    'What happens if we recover 30% of our overdue revenue?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user' as const, content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai-agent/query', {
        prompt: textToSend,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.answer,
          tools: res.data.toolsUsed,
          actionStaged: res.data.actionStaged,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error processing request: ${err.response?.data?.error || err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-all">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 text-white shadow-lg shadow-blue-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              PayPilot AI Agent
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Sandbox
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Deterministic Tool-Calling & Revenue Recovery</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-medium'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.tools && m.tools.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-500">Tools Called:</span>
                  {m.tools.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-blue-400 border border-slate-700/50"
                    >
                      {t}()
                    </span>
                  ))}
                </div>
              )}

              {m.actionStaged && (
                <button
                  onClick={() => {
                    navigate('/action-center');
                    onClose();
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Review in Action Center</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-blue-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 w-fit">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>AI Reasoning & Executing Backend Tools...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="border-t border-slate-800/80 px-4 py-2 bg-slate-950/40">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-blue-400" /> Suggested Prompts
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {quickPrompts.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/50 px-2.5 py-1 text-[11px] text-slate-300 text-left transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-800 p-4 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI revenue intelligence agent..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-500 transition-colors disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
