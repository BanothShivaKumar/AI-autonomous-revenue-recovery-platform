import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { InteractiveDemoModal } from '../common/InteractiveDemoModal';
import { LiveWebhookSimulatorModal } from '../common/LiveWebhookSimulatorModal';
import { AIAssistantDrawer } from '../common/AIAssistantDrawer';
import { api } from '../../api/client';
import {
  Sparkles,
  Zap,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);
  const [webhookSimOpen, setWebhookSimOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);

  const fetchPendingActions = async () => {
    try {
      const res = await api.get('/action-center');
      setPendingActionsCount(res.data.pendingCount || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchPendingActions();
    const interval = setInterval(fetchPendingActions, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B1120] font-sans text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar pendingActionsCount={pendingActionsCount} />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#0B1120]">
        {/* Clean Fintech Top Bar */}
        <header className="h-14 border-b border-[#273449] bg-[#111827]/90 px-6 flex items-center justify-between shrink-0 select-none z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-success-500/10 border border-success-500/20 text-success-500 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" />
              <span>PayPal Sandbox Connected</span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-mono">
              <Activity className="h-3 w-3" />
              <span>PostgreSQL Live</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setWebhookSimOpen(true)}
              className="fintech-btn-secondary"
              title="Simulate incoming PayPal webhook event"
            >
              <Zap className="h-3.5 w-3.5 text-warning-500" />
              <span className="hidden sm:inline">Simulate Webhook</span>
            </button>

            <button
              onClick={() => setAiDrawerOpen(true)}
              className="fintech-btn-ai"
              title="Open AI revenue operations copilot"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Copilot</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#0B1120]">
          <Outlet context={{ refreshGlobal: fetchPendingActions }} />
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <InteractiveDemoModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        onActionComplete={fetchPendingActions}
      />

      <LiveWebhookSimulatorModal
        isOpen={webhookSimOpen}
        onClose={() => setWebhookSimOpen(false)}
        onWebhookProcessed={fetchPendingActions}
      />

      <AIAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />
    </div>
  );
};


