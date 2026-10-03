import React, { useState } from 'react';
import { Modal } from './Modal';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bot,
  UserCheck,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck2,
  Play,
  RotateCcw,
} from 'lucide-react';

interface InteractiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const InteractiveDemoModal: React.FC<InteractiveDemoModalProps> = ({
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [executing, setExecuting] = useState(false);
  const [stepResult, setStepResult] = useState<string | null>(null);

  const steps = [
    {
      step: 1,
      title: 'Executive Revenue Dashboard',
      subtitle: 'Inspect processed revenue, outstanding exposure, and recovery opportunities for Nova Digital Studio.',
      icon: TrendingUp,
      route: '/dashboard',
      actionLabel: 'Go to Executive Dashboard',
      description:
        'Nova Digital Studio has processed $48,240 in revenue with $7,820 outstanding and $4,210 at risk. High-level KPIs and deterministic aging brackets are computed automatically from PayPal records.',
    },
    {
      step: 2,
      title: 'Ask AI Revenue Intelligence Agent',
      subtitle: 'Query the agent: "Why is my revenue at risk?"',
      icon: Bot,
      route: '/ai-agent',
      actionLabel: 'Launch AI Command Center',
      description:
        'The Revenue Intelligence Agent analyzes live application transactions, identifying 5 failed payments and overdue invoices without fabricating numbers.',
    },
    {
      step: 3,
      title: 'Customer Intelligence Breakdown',
      subtitle: 'View deterministic customer behavioral segments.',
      icon: UserCheck,
      route: '/customer-intelligence',
      actionLabel: 'Explore Customer Intelligence',
      description:
        'Customers are categorized into segments (Reliable, Reminder-Responsive, At-Risk, High-Value, Overdue, Declining) using transparent mathematical thresholds.',
    },
    {
      step: 4,
      title: 'Inspect Customer 360 Profile: Alex Technologies',
      subtitle: 'Deep dive into payment history and delay metrics.',
      icon: UserCheck,
      route: '/customers',
      actionLabel: 'View Customer Profile',
      description:
        'Alex Technologies historically generated $2,100 / 90 days with rapid 1.4-day payment discipline, but recently experienced payment failures and a 4-day overdue invoice.',
    },
    {
      step: 5,
      title: '"What Changed?" Behavioral Shift Analysis',
      subtitle: 'AI compares historical baseline vs recent 30-day activity.',
      icon: Sparkles,
      route: '/customers',
      actionLabel: 'Run "What Changed?" Engine',
      description:
        'PayPilot highlights that payment delay increased +4.8 days, 2 recent transaction failures occurred, and invoice #INV-1024 is overdue. Recommends gentle reminder.',
    },
    {
      step: 6,
      title: 'Formulate AI Revenue Recovery Actions',
      subtitle: 'Instruct AI: "Prepare recovery actions for customers overdue by >3 days"',
      icon: Bot,
      route: '/ai-agent',
      actionLabel: 'Stage Recovery Actions',
      actionAsync: async () => {
        setExecuting(true);
        try {
          const res = await api.post('/ai-agent/query', {
            prompt: 'Prepare recovery actions for customers overdue by more than 3 days',
          });
          setStepResult(`Success! Prepared ${res.data.toolData?.plan?.length || 4} recovery actions in the Action Center.`);
          if (onActionComplete) onActionComplete();
        } finally {
          setExecuting(false);
        }
      },
      description:
        'The AI Recovery Agent creates personalized friendly reminders for gentle accounts and flags high-value delinquent accounts for human Merchant Review.',
    },
    {
      step: 7,
      title: 'Action Center & Permission Engine Review',
      subtitle: 'Approve staged reminder for Alex Technologies (INV-1024).',
      icon: ShieldCheck,
      route: '/action-center',
      actionLabel: 'Open Action Center',
      description:
        'The Permission Engine enforces human-in-the-loop merchant approval. Merchant reviews the generated reminder tone, invoice amount ($450), and approves execution.',
    },
    {
      step: 8,
      title: 'Simulate Customer PayPal Payment Checkout',
      subtitle: 'Alex Technologies receives link and settles invoice via PayPal.',
      icon: Zap,
      route: '/invoices',
      actionLabel: 'Simulate Payment Receipt',
      actionAsync: async () => {
        setExecuting(true);
        try {
          const res = await api.post('/webhooks/simulate', {
            eventType: 'PAYMENT.CAPTURE.COMPLETED',
            invoiceNumber: 'INV-1024',
            amount: 450,
          });
          setStepResult(`Payment of $450 received and confirmed for Invoice #INV-1024!`);
          if (onActionComplete) onActionComplete();
        } finally {
          setExecuting(false);
        }
      },
      description:
        'Customer follows the secure PayPal invoice link and completes settlement of $450.',
    },
    {
      step: 9,
      title: 'PayPal Webhook Ingestion & Verification',
      subtitle: 'Webhook event PAYMENT.CAPTURE.COMPLETED verified.',
      icon: Zap,
      route: '/audit-log',
      actionLabel: 'View Webhook Event Logs',
      description:
        'PayPilot receives the verified PayPal webhook payload, matches the transaction to invoice #INV-1024 and customer Alex Technologies.',
    },
    {
      step: 10,
      title: 'Automated Feedback Loop: Reminder Auto-Cancellation',
      subtitle: 'Invoice marked PAID, future reminders cancelled, metrics refreshed.',
      icon: FileCheck2,
      route: '/reminders',
      actionLabel: 'Verify Cancelled Reminders',
      description:
        'CRITICAL SAFETY FEATURE: Because payment is confirmed, all scheduled reminders are automatically cancelled. No spam reaches the customer!',
    },
    {
      step: 11,
      title: 'Executive Loop Completed: Updated Health',
      subtitle: 'Recovered revenue rises, outstanding drops, account healthy.',
      icon: TrendingUp,
      route: '/dashboard',
      actionLabel: 'View Final Dashboard Results',
      description:
        'The merchant dashboard reflects immediate updates: Outstanding balance decreased by $450, Recovered Revenue increased, and Alex Technologies risk score lowered!',
    },
  ];

  const current = steps[currentStep - 1];
  const Icon = current.icon;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setStepResult(null);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setStepResult(null);
    }
  };

  const handleExecuteAction = async () => {
    if (current.actionAsync) {
      await current.actionAsync();
    } else {
      navigate(current.route);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PayPilot 3-Minute Hackathon Demo Flow"
      subtitle="Complete Step-by-Step Interactive Presentation Walkthrough (PayPal AI Hackathon 2026)"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>
              STEP {currentStep} OF {steps.length}
            </span>
            <span className="font-semibold text-blue-400">{current.title}</span>
          </div>
          <div className="grid grid-cols-11 gap-1">
            {steps.map((s) => (
              <button
                key={s.step}
                onClick={() => {
                  setCurrentStep(s.step);
                  setStepResult(null);
                }}
                className={`h-2 rounded-full transition-all ${
                  s.step === currentStep
                    ? 'bg-blue-500 ring-2 ring-blue-400/50'
                    : s.step < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/10 border border-blue-500/30 p-3 text-blue-400">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1">
                STEP {current.step}: {current.title}
              </div>
              <h4 className="text-base font-bold text-white">{current.subtitle}</h4>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            {current.description}
          </p>

          {stepResult && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{stepResult}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleExecuteAction}
              disabled={executing}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{executing ? 'Executing Action...' : current.actionLabel}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={handleNext}
                disabled={currentStep === steps.length}
                className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-30"
              >
                <span>Next Step</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
