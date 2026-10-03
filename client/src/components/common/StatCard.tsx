import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  trend?: string;
  colorVariant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  isPositive,
  trend,
  colorVariant = 'blue',
  onClick,
}) => {
  const colorMap = {
    blue: 'from-blue-600/20 to-indigo-600/5 text-blue-400 border-blue-500/20 group-hover:border-blue-500/40',
    emerald: 'from-emerald-600/20 to-teal-600/5 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40',
    amber: 'from-amber-600/20 to-orange-600/5 text-amber-400 border-amber-500/20 group-hover:border-amber-500/40',
    rose: 'from-rose-600/20 to-pink-600/5 text-rose-400 border-rose-500/20 group-hover:border-rose-500/40',
    purple: 'from-purple-600/20 to-violet-600/5 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:shadow-xl ${
        onClick ? 'cursor-pointer hover:border-slate-700' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <div className={`rounded-lg bg-gradient-to-br p-2.5 border ${colorMap[colorVariant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>

      {(change || trend) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {change && (
            <span
              className={`font-semibold ${
                isPositive !== undefined
                  ? isPositive
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {change}
            </span>
          )}
          {trend && <span className="text-slate-400">{trend}</span>}
        </div>
      )}
    </div>
  );
};
