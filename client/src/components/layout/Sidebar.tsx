import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  Bot,
  ShieldAlert,
  BellRing,
  Receipt,
  CreditCard,
  History,
  ScrollText,
  Workflow,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  pendingActionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingActionsCount = 0 }) => {
  const navItems = [
    {
      group: 'OVERVIEW & INTELLIGENCE',
      items: [
        { name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Customer Intelligence', path: '/customer-intelligence', icon: BrainCircuit },
        { name: 'Customer Grid (AG Grid)', path: '/customers', icon: Users },
      ],
    },
    {
      group: 'AI REVENUE OPERATIONS',
      items: [
        { name: 'AI Command Center', path: '/ai-agent', icon: Bot, badge: 'Agent' },
        {
          name: 'Action Center',
          path: '/action-center',
          icon: ShieldAlert,
          count: pendingActionsCount,
        },
        { name: 'Payment Reminders', path: '/reminders', icon: BellRing },
      ],
    },
    {
      group: 'PAYPAL FINANCIAL INFRASTRUCTURE',
      items: [
        { name: 'Invoices & Recovery', path: '/invoices', icon: Receipt },
        { name: 'Subscriptions & Dunning', path: '/subscriptions', icon: CreditCard },
        { name: 'Transactions', path: '/transactions', icon: History },
      ],
    },
    {
      group: 'GOVERNANCE & EVALUATION',
      items: [
        { name: 'Audit Log & Compliance', path: '/audit-log', icon: ScrollText },
        { name: 'Demo & Webhook Lab', path: '/demo-simulator', icon: Workflow, badge: 'Live' },
      ],
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-slate-800 bg-slate-950 p-4 select-none shrink-0 overflow-y-auto">
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-600/30 text-white font-black text-lg">
            P
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              PayPilot
              <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold text-blue-400 border border-blue-500/30">
                AI 2026
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Revenue Recovery Agent</p>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-6">
          {navItems.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.name}</span>
                      </div>

                      {item.count !== undefined && item.count > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-sm">
                          {item.count}
                        </span>
                      )}

                      {item.badge && !item.count && (
                        <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-blue-300 border border-blue-500/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / System Status */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-[11px] text-slate-400">
        <div className="flex items-center justify-between font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Permission Engine
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">STRICT_AUTH</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          Financial transactions require human approval.
        </p>
      </div>
    </aside>
  );
};
