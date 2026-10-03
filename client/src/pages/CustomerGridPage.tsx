import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { SegmentBadge, RiskBadge } from '../components/common/Badges';
import { Search, Sparkles, UserCheck, ArrowRight, Download } from 'lucide-react';

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
        headerName: 'Customer Name',
        minWidth: 200,
        pinned: 'left',
        cellRenderer: (params: any) => {
          if (!params.data) return null;
          return (
            <div className="flex flex-col justify-center h-full">
              <span className="font-semibold text-white hover:text-blue-400 cursor-pointer" onClick={() => navigate(`/customers/${params.data.customerId}`)}>
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
        width: 160,
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
        headerName: 'Risk Score',
        width: 150,
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
        cellClass: 'font-mono text-slate-200 font-semibold',
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
                <span className="font-bold text-amber-400">${val.toLocaleString()}</span>
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
              <span>{delay.toFixed(1)}d</span>
              {delta > 2.0 && (
                <span className="text-rose-400 text-[10px] font-bold" title={`Increased by +${delta.toFixed(1)}d recently`}>
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
              <span className={rate >= 80 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
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
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
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
            <div className="flex items-center h-full font-mono text-xs text-cyan-400 font-semibold">
              {rate.toFixed(0)}% ({sent} sent)
            </div>
          );
        },
      },
      {
        headerName: 'Action',
        width: 160,
        pinned: 'right',
        cellRenderer: (params: any) => {
          if (!params.data) return null;
          return (
            <div className="flex items-center gap-1.5 h-full">
              <button
                onClick={() => navigate(`/customers/${params.data.customerId}`)}
                className="flex items-center gap-1 rounded bg-blue-600/20 hover:bg-blue-600 px-2 py-1 text-[11px] font-semibold text-blue-300 hover:text-white border border-blue-500/30 transition-colors"
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Customer Analytics (AG Grid)
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
              {customers.length} Accounts
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sortable, filterable enterprise data grid with behavioral indicators and risk stratification.
          </p>
        </div>

        {/* Quick Search */}
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search customer, company, segment..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
        <div className="ag-theme-quartz-dark h-[620px] w-full rounded-xl overflow-hidden">
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
