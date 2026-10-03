import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Bot,
  Zap,
  Play,
  RotateCcw,
  Bell,
  ShieldCheck,
  ChevronDown,
  Building2,
} from 'lucide-react';

interface NavbarProps {
  onOpenDemo: () => void;
  onOpenWebhookSim: () => void;
  onOpenAIDrawer: () => void;
  pendingActionsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDemo,
  onOpenWebhookSim,
  onOpenAIDrawer,
  pendingActionsCount = 0,
}) => {
  const { merchant, user, loadDemoSession } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-md">
      {/* Left: Merchant Info & Sandbox Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {merchant?.name || 'Nova Digital Studio'}
            </h2>
            <p className="text-[10px] text-slate-400">PayPal Merchant Account (Sandbox)</p>
          </div>
        </div>

        {/* Prominent Sandbox Mode Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span>DEMO / PAYPAL SANDBOX</span>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2.5">
        {/* Step-by-Step Hackathon Demo Guide Trigger */}
        <button
          onClick={onOpenDemo}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>3-Min Hackathon Demo</span>
        </button>

        {/* Webhook Simulator Trigger */}
        <button
          onClick={onOpenWebhookSim}
          className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Simulate Webhook</span>
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={loadDemoSession}
          title="Reset Demo Dataset"
          className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Global AI Assistant Trigger */}
        <button
          onClick={onOpenAIDrawer}
          className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/40 transition-colors"
        >
          <Bot className="h-4 w-4 text-blue-400" />
          <span className="hidden sm:inline">Ask AI Agent</span>
        </button>

        {/* User Profile avatar */}
        <div className="ml-2 flex items-center gap-2.5 border-l border-slate-800 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SC'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-white leading-none">{user?.name || 'Sarah Chen'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{user?.role || 'MERCHANT_ADMIN'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
