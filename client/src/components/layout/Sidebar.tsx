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
  Shield,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  pendingActionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingActionsCount = 0 }) => {
  const navItems = [
    {
      group: 'INTELLIGENCE & OPERATIONS',
      items: [
        { name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Customer Intelligence', path: '/customer-intelligence', icon: BrainCircuit },
        { name: 'Customer 360 Grid', path: '/customers', icon: Users },
      ],
    },
    {
      group: 'AI REVENUE AGENT',
      items: [
        { name: 'AI Command Center', path: '/ai-agent', icon: Bot, isAi: true },
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
      group: 'FINANCIAL INFRASTRUCTURE',
      items: [
        { name: 'Invoices & Recovery', path: '/invoices', icon: Receipt },
        { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
        { name: 'Transactions', path: '/transactions', icon: History },
      ],
    },
    {
      group: 'GOVERNANCE & LAB',
      items: [
        { name: 'Audit Trail', path: '/audit-log', icon: ScrollText },
        { name: 'Simulation & Webhooks', path: '/demo-simulator', icon: Workflow },
      ],
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-[#273449] bg-[#0B1120] p-4 select-none shrink-0 overflow-y-auto z-20">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white font-bold text-base shadow-sm">
            P
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-tight">PayPilot</h1>
              <span className="rounded bg-brand-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-brand-400 border border-brand-500/20">
                AI Ops
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Revenue Recovery Suite</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-5">
          {navItems.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
                        `flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-brand-500/10 text-brand-400 font-semibold border-l-2 border-brand-500'
                            : 'text-slate-300 hover:bg-[#111827] hover:text-white'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 shrink-0 ${item.isAi ? 'text-ai-500' : ''}`} />
                        <span>{item.name}</span>
                      </div>

                      {item.count !== undefined && item.count > 0 && (
                        <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-warning-500 text-[10px] font-bold text-white">
                          {item.count}
                        </span>
                      )}

                      {item.isAi && (
                        <span className="rounded bg-ai-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-ai-500 border border-ai-500/20">
                          AI
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

      {/* Footer System Status */}
      <div className="pt-3 border-t border-[#273449]/80 space-y-2 text-xs">
        <div className="rounded-lg border border-[#273449] bg-[#111827] p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
              PayPal Sandbox
            </span>
            <span className="font-mono text-[10px] text-success-500 font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-slate-400" />
              Permission Engine
            </span>
            <span className="font-mono text-[10px] text-brand-400 font-semibold">Tier 4 Safe</span>
          </div>
        </div>
      </div>
    </aside>
  );
};


