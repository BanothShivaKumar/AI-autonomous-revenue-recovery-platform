import React, { useState } from 'react';
import { api } from '../api/client';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  ArrowRight,
  RefreshCw,
  Sliders,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; tools?: string[]; toolData?: any; actionStaged?: boolean }>>([
    {
      role: 'assistant',
      content: `### PayPilot AI Revenue Intelligence & Recovery Agent

I am your dedicated revenue operations agent. I combine PayPal transaction telemetry, customer behavioral intelligence, and permission-controlled workflows.

**You can ask me questions like:**
1. *"Why did my revenue decrease this month?"*
2. *"Show me customers whose payment behavior has deteriorated"*
3. *"What changed with Alex Technologies?"*
4. *"Which customers respond best to reminders?"*
5. *"Prepare recovery actions for customers overdue by more than 3 days"*
6. *"What happens if we recover 30% of our overdue revenue?"*`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Scenario Simulator State
  const [simPercent, setSimPercent] = useState(30);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  const handleRunQuery = async (queryText?: string) => {
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
          toolData: res.data.toolData,
          actionStaged: res.data.actionStaged,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error executing AI agent command: ${err.response?.data?.error || err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    setSimLoading(true);
    try {
      const res = await api.post('/ai-agent/simulate', {
        recoveryPercentage: simPercent,
      });
      setSimulationResult(res.data.simulation);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          AI Command Center & Agent Reasoning
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
            Controlled Tool-Calling
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Execute multi-agent operations across revenue intelligence, customer behavioral shifts, and recovery action staging.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Conversation Stream */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col h-[700px] overflow-hidden shadow-2xl">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[90%] rounded-2xl p-5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {m.tools && m.tools.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-500">Controlled Tools Executed:</span>
                      {m.tools.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-slate-900 px-2 py-0.5 font-mono text-blue-400 border border-slate-700/50"
                        >
                          {t}()
                        </span>
                      ))}
                    </div>
                  )}

                  {m.actionStaged && (
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => navigate('/action-center')}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30 transition-all"
                      >
                        <Shield className="h-4 w-4" />
                        <span>Open Action Center to Review & Authorize</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-blue-400 bg-slate-950 p-4 rounded-2xl border border-slate-800 w-fit">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Executing multi-step reasoning & retrieving live PayPal data...</span>
              </div>
            )}
          </div>

          {/* Quick Queries */}
          <div className="border-t border-slate-800 bg-slate-950/60 px-5 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Quick Prompts:</span>
              <button
                onClick={() => handleRunQuery('Why did my revenue decrease this month?')}
                className="shrink-0 rounded-lg bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 border border-slate-700/50"
              >
                Why did revenue decrease?
              </button>
              <button
                onClick={() => handleRunQuery('Show me customers whose payment behavior has deteriorated')}
                className="shrink-0 rounded-lg bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 border border-slate-700/50"
              >
                Deteriorating customers
              </button>
              <button
                onClick={() => handleRunQuery('Prepare recovery actions for customers overdue by more than 3 days')}
                className="shrink-0 rounded-lg bg-blue-950/50 hover:bg-blue-900/50 px-2.5 py-1 text-[11px] text-blue-300 border border-blue-500/30"
              >
                Prepare recovery actions
              </button>
            </div>
          </div>

          {/* Input Bar */}
          <div className="border-t border-slate-800 p-4 bg-slate-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunQuery();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI revenue recovery agent..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-500 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <Send className="h-4 w-4" />
                <span>Execute</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Scenario Simulator (Requirement #40) */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-400" />
                <span>AI Revenue Scenario Simulator</span>
              </h3>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                Deterministic
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Simulate cash flow recovery outcomes under various target percentages based on current outstanding balances.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Recovery Target Rate:</span>
                <span className="font-mono text-base font-bold text-blue-400">{simPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={simPercent}
                onChange={(e) => setSimPercent(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10%</span>
                <span>30% (Standard)</span>
                <span>50%</span>
                <span>90%</span>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={simLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-white transition-colors"
            >
              {simLoading ? 'Simulating...' : `Simulate ${simPercent}% Recovery Target`}
            </button>

            {simulationResult && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4 space-y-3 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Outstanding:</span>
                  <span className="font-mono font-bold text-white">
                    ${simulationResult.currentOutstandingRevenue?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="font-semibold">Projected Recovery:</span>
                  <span className="font-mono font-bold text-base">
                    +${simulationResult.projectedRecoveredAmount?.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <p className="font-semibold text-slate-300 text-[11px]">Recommended Action Steps:</p>
                  {simulationResult.actionPlan?.map((p: any) => (
                    <div key={p.step} className="text-[11px] text-slate-400 leading-snug">
                      • {p.action} (<strong className="text-slate-200">${p.potentialRecovery}</strong>)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
