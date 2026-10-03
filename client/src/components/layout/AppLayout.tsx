import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { InteractiveDemoModal } from '../common/InteractiveDemoModal';
import { LiveWebhookSimulatorModal } from '../common/LiveWebhookSimulatorModal';
import { AIAssistantDrawer } from '../common/AIAssistantDrawer';
import { api } from '../../api/client';

export const AppLayout: React.FC = () => {
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar pendingActionsCount={pendingActionsCount} />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          onOpenDemo={() => setDemoOpen(true)}
          onOpenWebhookSim={() => setWebhookSimOpen(true)}
          onOpenAIDrawer={() => setAiDrawerOpen(true)}
          pendingActionsCount={pendingActionsCount}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
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
