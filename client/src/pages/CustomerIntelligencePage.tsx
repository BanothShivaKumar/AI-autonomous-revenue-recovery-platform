import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SegmentBadge, RiskBadge } from '../components/common/Badges';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Users,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Filter,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const CustomerIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const [segments, setSegments] = useState<Record<string, any>>({});
  const [definitions, setDefinitions] = useState<Record<string, any>>({});
  const [selectedSegmentKey, setSelectedSegmentKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSegments = async () => {
    try {
      const res = await api.get('/segments');
      setSegments(res.data.segments || {});
      setDefinitions(res.data.definitions || {});
    } catch (e) {
      console.error('Failed to load segments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400 text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="font-semibold text-slate-300">Analyzing Customer Behavioral Telemetry...</span>
        </div>
      </div>
    );
  }

  const segmentList = Object.values(segments);
  const activeSegment = selectedSegmentKey ? segments[selectedSegmentKey] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Customer Intelligence Engine
            </h1>
            <span className="rounded-full bg-ai-500/10 px-2.5 py-0.5 text-xs font-bold text-ai-400 border border-ai-500/30">
              Deterministic Segmentation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Behavioral analysis across payment discipline, delay trajectory, reminder responsiveness, and churn risk.
          </p>
        </div>

        <button
          onClick={() => navigate('/customers')}
          className="fintech-btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <Users className="h-4 w-4 text-brand-400" />
          <span>Open Full AG Grid View</span>
        </button>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {segmentList.map((seg: any) => {
          const isSelected = selectedSegmentKey === seg.segment;
          const def = definitions[seg.segment];

          return (
            <div
              key={seg.segment}
              onClick={() => setSelectedSegmentKey(isSelected ? null : seg.segment)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-brand-500 bg-brand-500/10 shadow-card ring-1 ring-brand-500/40'
                  : 'border-fintech-border bg-fintech-surface hover:border-brand-500/30 hover:bg-fintech-secondary/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <SegmentBadge segment={seg.segment} />
                  <span className="text-base font-bold text-slate-100 font-mono bg-fintech-bg px-2 py-0.5 rounded border border-fintech-border">
                    {seg.count}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 mt-3.5 tracking-tight">{seg.label}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{seg.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-fintech-border space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-medium">Total Revenue:</span>
                  <span className="font-bold text-slate-100 font-mono">${seg.totalRevenue?.toLocaleString()}</span>
                </div>
                {seg.outstandingRevenue > 0 && (
                  <div className="flex justify-between text-warning-400">
                    <span className="text-slate-400 font-medium">Outstanding:</span>
                    <span className="font-bold font-mono">${seg.outstandingRevenue?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-medium">Avg Risk Score:</span>
                  <span className="font-bold font-mono text-slate-200">{seg.averageRiskScore}/100</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Segment Breakdown */}
      {activeSegment && (
        <div className="fintech-card p-6 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-fintech-border">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-100">{activeSegment.label} Cohort</h3>
                <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                  {activeSegment.count} Accounts
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeSegment.description}</p>
              {definitions[activeSegment.segment]?.rule && (
                <p className="text-[11px] font-mono text-slate-300 mt-2 bg-fintech-bg px-2.5 py-1 rounded-lg border border-fintech-border w-fit">
                  Deterministic Rule: {definitions[activeSegment.segment].rule}
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedSegmentKey(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white bg-fintech-bg hover:bg-fintech-secondary px-3 py-1.5 rounded-lg border border-fintech-border transition-all self-start sm:self-auto"
            >
              Clear Filter ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSegment.customers.map((c: any) => (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="cursor-pointer rounded-xl border border-fintech-border bg-fintech-bg p-4 hover:border-brand-500/40 hover:bg-fintech-secondary/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-brand-400 transition-colors truncate">{c.name}</h4>
                    <RiskBadge score={c.riskScore} showText={false} />
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{c.company || c.email}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-fintech-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Lifetime: </span>
                    <span className="font-bold text-slate-100 font-mono">${c.revenue?.toLocaleString()}</span>
                  </div>
                  {c.outstanding > 0 ? (
                    <span className="text-risk-400 font-bold font-mono bg-risk-500/10 px-2 py-0.5 rounded border border-risk-500/20">
                      ${c.outstanding?.toLocaleString()} overdue
                    </span>
                  ) : (
                    <span className="text-success-400 text-[11px] font-bold bg-success-500/10 px-2 py-0.5 rounded border border-success-500/20 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Paid Up
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
