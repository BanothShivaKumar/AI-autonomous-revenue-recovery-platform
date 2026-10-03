import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { SegmentBadge, RiskBadge } from '../components/common/Badges';
import { Search, Sparkles, UserCheck, ArrowRight, Download, RefreshCw, Layers } from 'lucide-react';

export const CustomerGridPage: React.FC = () => {
  const navigate = useNavigate();
  const gridRef = useRef<AgGridReact>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickFilterText, setQuickFilterText] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.customers || []);
    } catch (e) {
      console.error('Failed to load customer grid:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: 'name',
        headerName: 'Customer & Account',
        minWidth: 220,
        pinned: 'left',
        cellRenderer: (params: any) => {
          if (!params.data) return null;
          return (
            <div className="flex flex-col justify-center h-full">
              <span
                className="font-bold text-slate-100 hover:text-brand-400 transition-colors cursor-pointer"
                onClick={() => navigate(`/customers/${params.data.customerId}`)}
              >
                {params.value}
              </span>
              <span className="text-[11px] text-slate-400 truncate leading-none">
                {params.data.company || params.data.email}
              </span>
            </div>
          );
        },
      },
      {
        field: 'suggestedSegment',
        headerName: 'Segment',
        width: 170,
        cellRenderer: (params: any) => {
          if (!params.value) return null;
          return (
            <div className="flex items-center h-full">
              <SegmentBadge segment={params.value} />
            </div>
          );
        },
      },
      {
        field: 'riskScore',
        headerName: 'Risk Stratification',
        width: 160,
        sort: 'desc',
        cellRenderer: (params: any) => {
          if (params.value === undefined) return null;
          return (
            <div className="flex items-center h-full">
              <RiskBadge score={params.value} />
            </div>
          );
        },
      },
      {
        field: 'lifetimeRevenue',
        headerName: 'Lifetime Revenue',
        width: 150,
        valueFormatter: (params) => `$${params.value?.toLocaleString() || 0}`,
        cellClass: 'font-mono text-slate-100 font-bold',
      },
      {
        field: 'revenue30d',
        headerName: '30D Revenue',
        width: 130,
        valueFormatter: (params) => `$${params.value?.toLocaleString() || 0}`,
        cellClass: 'font-mono text-slate-300',
      },
      {
        field: 'revenue90d',
        headerName: '90D Revenue',
        width: 130,
        valueFormatter: (params) => `$${params.value?.toLocaleString() || 0}`,
        cellClass: 'font-mono text-slate-300',
      },
      {
        field: 'outstandingInvoiceAmount',
        headerName: 'Outstanding',
        width: 140,
        cellRenderer: (params: any) => {
          const val = params.value || 0;
          return (
            <div className="flex items-center h-full font-mono">
              {val > 0 ? (
                <span className="font-bold text-warning-400 bg-warning-500/10 px-2 py-0.5 rounded border border-warning-500/20">
                  ${val.toLocaleString()}
                </span>
              ) : (
                <span className="text-slate-500">$0</span>
              )}
            </div>
          );
        },
      },
      {
        field: 'averagePaymentDelayDays',
        headerName: 'Avg Delay (Days)',
        width: 140,
        cellRenderer: (params: any) => {
          const delay = params.value || 0;
          const delta = params.data?.delayChangeDays || 0;
          return (
            <div className="flex items-center gap-1.5 h-full font-mono text-xs">
              <span className="font-semibold text-slate-200">{delay.toFixed(1)}d</span>
              {delta > 2.0 && (
                <span className="text-risk-400 text-[10px] font-bold" title={`Increased by +${delta.toFixed(1)}d recently`}>
                  (+{delta.toFixed(1)}d)
                </span>
              )}
            </div>
          );
        },
      },
      {
        field: 'onTimePaymentPercentage',
        headerName: 'On-Time Rate',
        width: 130,
        cellRenderer: (params: any) => {
          const rate = params.value || 0;
          return (
            <div className="flex items-center h-full font-mono text-xs">
              <span className={rate >= 80 ? 'text-success-400 font-bold' : 'text-warning-400 font-bold'}>
                {rate.toFixed(0)}%
              </span>
            </div>
          );
        },
      },
      {
        field: 'failedTransactions',
        headerName: 'Failed Payments',
        width: 140,
        cellRenderer: (params: any) => {
          const count = params.value || 0;
          return (
            <div className="flex items-center h-full font-mono text-xs">
              {count > 0 ? (
                <span className="px-2 py-0.5 rounded bg-risk-500/10 text-risk-400 font-bold border border-risk-500/20">
                  {count} failed
                </span>
              ) : (
                <span className="text-slate-500">0</span>
              )}
            </div>
          );
        },
      },
      {
        field: 'reminderConversionRate',
        headerName: 'Reminder Conv.',
        width: 140,
        cellRenderer: (params: any) => {
          const rate = params.value || 0;
          const sent = params.data?.remindersSentCount || 0;
          if (sent === 0) return <span className="text-slate-500 text-xs">—</span>;
          return (
            <div className="flex items-center h-full font-mono text-xs text-ai-400 font-bold">
              {rate.toFixed(0)}% ({sent} sent)
            </div>
          );
        },
      },
      {
        headerName: 'Action',
        width: 130,
        pinned: 'right',
        cellRenderer: (params: any) => {
          if (!params.data) return null;
          return (
            <div className="flex items-center gap-1.5 h-full">
              <button
                onClick={() => navigate(`/customers/${params.data.customerId}`)}
                className="flex items-center gap-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 text-[11px] font-semibold text-brand-400 border border-brand-500/30 transition-colors"
              >
                <span>Profile</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          );
        },
      },
    ],
    [navigate]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Customer Telemetry Grid
            </h1>
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-bold text-brand-400 border border-brand-500/30">
              {customers.length} Accounts Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sortable, filterable enterprise data grid with behavioral indicators and risk stratification.
          </p>
        </div>

        {/* Quick Search */}
        <div className="flex items-center gap-3">
          <div className="relative w-72 sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search customer, company, segment..."
              className="fintech-input pl-10 pr-4 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="fintech-card p-3 shadow-card">
        <div className="ag-theme-quartz-dark h-[620px] w-full rounded-xl overflow-hidden border border-fintech-border">
          <AgGridReact
            ref={gridRef}
            rowData={customers}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            pagination={true}
            paginationPageSize={15}
            paginationPageSizeSelector={[10, 15, 25, 50]}
            rowHeight={48}
            headerHeight={44}
            animateRows={true}
          />
        </div>
      </div>
    </div>
  );
};
