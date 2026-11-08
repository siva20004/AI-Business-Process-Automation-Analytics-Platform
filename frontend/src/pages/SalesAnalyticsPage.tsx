import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import {
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  Calendar,
  Database,
  RefreshCw,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
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

export const SalesAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [filterOptions, setFilterOptions] = useState<{ categories: string[]; statuses: string[] }>({
    categories: [],
    statuses: [],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, filtersRes] = await Promise.all([
        analyticsService.getSales({
          time_range: timeRange,
          category: selectedCategory,
          status: selectedStatus,
        }),
        analyticsService.getFilters(),
      ]);
      setData(salesRes);
      setFilterOptions(filtersRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange, selectedCategory, selectedStatus]);

  const kpis = data?.kpis;
  const meta = data?.metadata;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Module 6</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-500">売上・業績詳細分析</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Sales & Revenue Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real transactional performance, period-over-period comparisons, average basket value, and divisional breakdowns.
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
            onClick={fetchData}
            title="Refresh metrics from PostgreSQL"
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-1.5 border border-slate-300 rounded-md bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Divisions</option>
            {filterOptions.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-1.5 border border-slate-300 rounded-md bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Provenance Metadata Bar */}
      {meta && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Data Source</span>
            <span className="font-medium text-slate-800 flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{meta.data_source}</span>
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
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Verified Transactions</span>
            <span className="font-bold text-slate-900 font-mono">
              {(meta?.records_processed ?? 0).toLocaleString()} rows
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Calculation Standard</span>
            <span className="font-medium text-slate-700 truncate block" title={meta.calculation_method}>
              {meta.calculation_method}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data?.has_data ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No sales transaction records available for this filter.
          </h3>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mt-2">
            Upload enterprise operational sales receipts via the Data Upload Center to populate analytics.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs inline-flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Go to Data Upload Center</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Net Revenue</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                ¥{(kpis?.total_sales ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Direct sum of verified amounts</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Transaction Volume</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {(kpis?.total_transactions ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Count of non-duplicate orders</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Average Transaction Value (ATV)</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                ¥{(kpis?.average_transaction_value ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total Sales / Transaction Count</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Units Sold</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {(kpis?.total_quantity_sold ?? 0).toLocaleString()}
              </div>
              <div className="text-[11px] mt-1">
                {kpis.sales_growth_pct !== null ? (
                  <span
                    className={`font-semibold inline-flex items-center gap-0.5 ${
                      kpis.sales_growth_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {kpis.sales_growth_pct >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {kpis.sales_growth_pct}% vs Prev Period
                  </span>
                ) : (
                  <span className="text-slate-400">Baseline established</span>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend Chart */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Daily Sales Trend</h3>
              <p className="text-xs text-slate-500 mb-4">Daily aggregated revenue (SQL SUM)</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#salesArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Performance Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Revenue by Business Category</h3>
              <p className="text-xs text-slate-500 mb-4">Divisional breakdown across enterprise group</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.category_performance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]}>
                      {data.category_performance.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Products Performance Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Top Products Performance Ranking</h3>
            <p className="text-xs text-slate-500 mb-4">
              Products and services sorted by total generated revenue.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Rank</th>
                    <th className="p-2.5">SKU / Product ID</th>
                    <th className="p-2.5">Product Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Units Sold</th>
                    <th className="p-2.5 text-right">Transactions</th>
                    <th className="p-2.5 text-right">Revenue</th>
                    <th className="p-2.5 text-right">Share %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.top_products.map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-500">#{idx + 1}</td>
                      <td className="p-2.5 text-blue-600 font-semibold">{p.product_id}</td>
                      <td className="p-2.5 font-medium text-slate-900">{p.product_name}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-semibold">{p.units_sold}</td>
                      <td className="p-2.5 text-right text-slate-600">{p.transactions}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        ¥{(p?.revenue ?? 0).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right text-slate-500">{p.percentage_of_sales}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
