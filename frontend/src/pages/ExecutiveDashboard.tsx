import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';
import { DashboardResponse } from '../types';
import {
  TrendingUp,
  Receipt,
  Boxes,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  UploadCloud,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const TIME_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Records', value: 'all' },
];

const COLORS = ['#2563EB', '#0284C7', '#059669', '#D97706', '#7C3AED', '#BE123C'];

export const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (range: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getSummary(range);
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load executive dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(timeRange);
  }, [timeRange]);

  const kpis = data?.kpis;
  const meta = data?.metadata;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Module Title & Reporting Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Module 1</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-500">統合経営分析</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Executive Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-segment operations across transportation, tourism, hotels, retail and food services.
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs">
            {TIME_RANGES.map((item) => (
              <button
                key={item.value}
                onClick={() => setTimeRange(item.value)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  timeRange === item.value
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboard(timeRange)}
            title="Refresh metrics from PostgreSQL"
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real Data Governance & Traceability Metadata Bar */}
      {meta && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Data Source</span>
            <span className="font-medium text-slate-800 flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate">{meta.data_source}</span>
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Reporting Window</span>
            <span className="font-medium text-slate-800 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{meta.reporting_period}</span>
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Records Processed</span>
            <span className="font-semibold text-slate-800 font-mono">
              {(meta.records_processed ?? 0).toLocaleString()} rows
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Last Calculation</span>
            <span className="font-medium text-slate-700 font-mono">
              {meta.last_processing_time
                ? new Date(meta.last_processing_time).toLocaleTimeString()
                : 'Awaiting Run'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Method</span>
            <span className="font-medium text-slate-700 truncate block" title={meta.calculation_method}>
              {meta.calculation_method}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Data Quality</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              {meta.data_quality_status}
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Sales</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {kpis?.has_real_data ? `¥${(kpis.total_sales ?? 0).toLocaleString()}` : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpis?.has_real_data ? 'Verified transactions' : 'No recorded transactions'}
          </p>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Transactions</span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {kpis?.has_real_data ? (kpis.total_transactions ?? 0).toLocaleString() : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpis?.has_real_data ? 'Valid ingested records' : 'No records imported'}
          </p>
        </div>

        {/* Avg Transaction Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Avg Transaction</span>
            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {kpis?.has_real_data ? `¥${(kpis.average_transaction_value ?? 0).toLocaleString()}` : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total Sales / Tx Count</p>
        </div>

        {/* Total Inventory Items */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Inventory SKUs</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {(kpis?.total_inventory_items ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpis?.low_stock_items ? (
              <span className="text-amber-600 font-semibold">{kpis.low_stock_items} Low Stock</span>
            ) : (
              'Active warehouse records'
            )}
          </p>
        </div>

        {/* Detected Anomalies */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Flagged Anomalies</span>
            <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {kpis?.detected_anomalies ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpis?.detected_anomalies ? 'Requires review' : 'No anomalies flagged'}
          </p>
        </div>

        {/* Workflow Jobs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Processing Jobs</span>
            <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {kpis?.total_processing_jobs ?? 0}
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-1 font-mono">
            <span className="text-emerald-600 flex items-center gap-0.5">
              <CheckCircle className="w-3 h-3" /> {kpis?.successful_jobs ?? 0}
            </span>
            <span className="text-rose-600 flex items-center gap-0.5">
              <XCircle className="w-3 h-3" /> {kpis?.failed_jobs ?? 0}
            </span>
          </div>
        </div>

        {/* Reports Generated */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Reports Generated</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {kpis?.reports_generated ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Audit-ready exports</p>
        </div>
      </div>

      {/* STRICT REAL DATA EMPTY STATE (Mandatory per Section 1) */}
      {!kpis?.has_real_data && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No business data available. Connect a data source or upload a dataset.
          </h3>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mt-2">
            FUJI FLOW strictly forbids fabricated, fake, or mock numbers. All dashboard KPIs, daily sales trends,
            and category distributions require actual uploaded CSV/Excel files or verified database connections.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => navigate('/upload')}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Go to Data Upload Center</span>
            </button>
            <button
              onClick={() => navigate('/data-sources')}
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-xs flex items-center gap-2 shadow-xs transition-all"
            >
              <Database className="w-4 h-4 text-blue-600" />
              <span>Manage Connected Data Sources</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-800">1. Data Ingestion</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload transaction CSVs or Excel reports from operating business units.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-800">2. Clean & Validate</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Verify math contracts (quantity × unit price = total amount) and remove duplicates.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-800">3. Real Analytics</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Calculations populate directly in PostgreSQL and refresh this dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actual Data Visualizations (Rendered ONLY when actual records exist) */}
      {kpis?.has_real_data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales Trend Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daily Sales Trends</h3>
                <p className="text-xs text-slate-500">Actual aggregated sales revenue over time</p>
              </div>
              <span className="text-[11px] font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                SQL SUM(total_amount)
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.sales_trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, 'Revenue']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Business Unit / Category Performance */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Revenue by Business Category</h3>
                <p className="text-xs text-slate-500">Transportation, Tourism, Hotels, Amusement, Food, Retail</p>
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                GROUP BY category
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.category_performance || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]}>
                    {(data?.category_performance || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
