import React, { useState } from 'react';
import { api } from '../api/client';
import {
  Sparkles,
  Send,
  Shield,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Lock,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; tools?: string[]; toolData?: any; actionStaged?: boolean }>>([
    {
      role: 'assistant',
      content: `### PayPilot AI Revenue Recovery Agent

I analyze your PayPal telemetry, detect behavioral deterioration, and stage permission-controlled recovery actions.

**Suggested prompts:**
• *"Why is revenue down?"*
• *"What changed with our highest-value customers?"*
• *"Find the biggest recovery opportunities."*
• *"Prepare reminders for overdue customers."*`,
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Section 12 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AI Command Center
            </h1>
            <span className="rounded-full bg-ai-500/10 px-2.5 py-0.5 text-xs font-semibold text-ai-500 border border-ai-500/20">
              Operations Agent
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Ask PayPilot to analyze your revenue, customers, or recovery opportunities.
          </p>
        </div>

        {/* Section 17: Security Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#273449] bg-[#111827] text-xs">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-400">Permission:</span>
          <span className="font-semibold text-brand-400">Strict Auth (Level 2)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Conversation Stream */}
        <div className="lg:col-span-2 fintech-card flex flex-col h-[680px] overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[90%] rounded-xl p-4 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-500 text-white font-medium shadow-sm'
                      : 'bg-[#172033] border border-[#273449] text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Section 13: AI Execution Trace */}
                  {m.role === 'assistant' && m.tools && m.tools.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#273449] space-y-2">
                      <div className="flex items-center gap-1.5 text-ai-500 font-semibold text-[11px]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>✦ PayPilot AI Execution Trace</span>
                      </div>
                      
                      <div className="space-y-1 text-[11px] font-mono text-slate-300">
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-slate-400">Analyzing revenue</span>
                          <span className="text-success-500 font-bold">✓</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-slate-400">Analyzing customer behavior</span>
                          <span className="text-success-500 font-bold">✓</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-slate-400">Identifying revenue risk</span>
                          <span className="text-success-500 font-bold">✓</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-slate-400">Preparing recovery recommendation</span>
                          <span className="text-success-500 font-bold">✓</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-slate-400">Awaiting merchant approval</span>
                          <span className="text-warning-500 font-bold">●</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {m.actionStaged && (
                    <div className="mt-4 pt-3 border-t border-[#273449]">
                      <button
                        onClick={() => navigate('/action-center')}
                        className="w-full fintech-btn-primary py-2"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Open Action Center to Review & Authorize</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-ai-500 bg-[#172033] p-3 rounded-xl border border-[#273449] w-fit">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-ai-500" />
                <span>Executing multi-step reasoning & analyzing PayPal telemetry...</span>
              </div>
            )}
          </div>

          {/* Suggested Prompts (Section 12) */}
          <div className="border-t border-[#273449] bg-[#111827] px-4 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Prompts:</span>
              <button
                onClick={() => handleRunQuery('Why is revenue down?')}
                className="shrink-0 rounded-lg bg-[#172033] hover:bg-[#1f2c47] px-2.5 py-1 text-[11px] text-slate-300 border border-[#273449] transition-all"
              >
                Why is revenue down?
              </button>
              <button
                onClick={() => handleRunQuery('What changed with our highest-value customers?')}
                className="shrink-0 rounded-lg bg-[#172033] hover:bg-[#1f2c47] px-2.5 py-1 text-[11px] text-slate-300 border border-[#273449] transition-all"
              >
                What changed with highest-value customers?
              </button>
              <button
                onClick={() => handleRunQuery('Find the biggest recovery opportunities.')}
                className="shrink-0 rounded-lg bg-[#172033] hover:bg-[#1f2c47] px-2.5 py-1 text-[11px] text-slate-300 border border-[#273449] transition-all"
              >
                Find recovery opportunities
              </button>
              <button
                onClick={() => handleRunQuery('Prepare reminders for overdue customers.')}
                className="shrink-0 rounded-lg bg-ai-500/10 hover:bg-ai-500/20 px-2.5 py-1 text-[11px] font-semibold text-ai-500 border border-ai-500/30 transition-all"
              >
                Prepare reminders for overdue
              </button>
            </div>
          </div>

          {/* Input Bar (Section 12) */}
          <div className="border-t border-[#273449] p-3.5 bg-[#111827]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunQuery();
              }}
              className="flex items-center gap-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask PayPilot to analyze revenue, customers, or recovery opportunities..."
                className="fintech-input"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="fintech-btn-ai py-2 px-4 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Run →</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Scenario Simulator */}
        <div className="space-y-4">
          <div className="fintech-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-brand-400" />
                <span>AI Revenue Scenario Simulator</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Deterministic</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Simulate cash flow recovery outcomes under various target percentages based on current outstanding balances.
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Recovery Target Rate:</span>
                <span className="font-mono text-sm font-bold text-brand-400">{simPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={simPercent}
                onChange={(e) => setSimPercent(parseInt(e.target.value, 10))}
                className="w-full accent-brand-500"
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
              className="w-full fintech-btn-secondary py-2"
            >
              {simLoading ? 'Simulating...' : `Simulate ${simPercent}% Target`}
            </button>

            {simulationResult && (
              <div className="rounded-lg border border-[#273449] bg-[#172033] p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Outstanding:</span>
                  <span className="font-mono font-semibold text-white">
                    ${simulationResult.currentOutstandingRevenue?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-success-500">
                  <span className="font-medium">Projected Recovery:</span>
                  <span className="font-mono font-bold text-sm">
                    +${simulationResult.projectedRecoveredAmount?.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#273449] space-y-1">
                  <p className="font-semibold text-slate-300 text-[11px]">Recommended Actions:</p>
                  {simulationResult.actionPlan?.map((p: any) => (
                    <div key={p.step} className="text-[11px] text-slate-400">
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


