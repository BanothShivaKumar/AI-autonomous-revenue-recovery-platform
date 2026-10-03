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
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Analyzing Customer Behavioral Telemetry...</span>
        </div>
      </div>
    );
  }

  const segmentList = Object.values(segments);
  const activeSegment = selectedSegmentKey ? segments[selectedSegmentKey] : null;

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Customer Intelligence Engine
            <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/20">
              Deterministic Segmentation
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Behavioral analysis across payment discipline, delay trajectory, reminder sensitivity, and churn risk.
          </p>
        </div>

        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          <Users className="h-4 w-4 text-blue-400" />
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
              className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 bg-slate-900 shadow-xl ring-2 ring-blue-500/30'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <SegmentBadge segment={seg.segment} />
                  <span className="text-lg font-bold text-white font-mono">{seg.count}</span>
                </div>

                <h3 className="text-sm font-bold text-white mt-3">{seg.label}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{seg.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Total Revenue:</span>
                  <span className="font-semibold text-white font-mono">${seg.totalRevenue?.toLocaleString()}</span>
                </div>
                {seg.outstandingRevenue > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span className="text-slate-400">Outstanding:</span>
                    <span className="font-semibold font-mono">${seg.outstandingRevenue?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Avg Risk Score:</span>
                  <span className="font-semibold font-mono text-slate-200">{seg.averageRiskScore}/100</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Segment Breakdown */}
      {activeSegment && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-white">{activeSegment.label} Cohort</h3>
                <span className="text-xs font-mono text-slate-400">({activeSegment.count} Accounts)</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeSegment.description}</p>
              {definitions[activeSegment.segment]?.rule && (
                <p className="text-[11px] font-mono text-blue-400 mt-1 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/20 w-fit">
                  Rule: {definitions[activeSegment.segment].rule}
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedSegmentKey(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear Filter ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSegment.customers.map((c: any) => (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-blue-500/50 hover:bg-slate-950 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate">{c.name}</h4>
                    <RiskBadge score={c.riskScore} showText={false} />
                  </div>
                  <p className="text-xs text-slate-400 truncate">{c.company || c.email}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Lifetime: </span>
                    <span className="font-semibold text-white font-mono">${c.revenue?.toLocaleString()}</span>
                  </div>
                  {c.outstanding > 0 ? (
                    <span className="text-amber-400 font-semibold font-mono">${c.outstanding?.toLocaleString()} overdue</span>
                  ) : (
                    <span className="text-emerald-400 text-[11px]">Paid Up</span>
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
