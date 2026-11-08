import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import {
  Boxes,
  AlertTriangle,
  Building2,
  DollarSign,
  TrendingDown,
  RefreshCw,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InventoryAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterOptions, setFilterOptions] = useState<{ categories: string[]; warehouses: string[] }>({
    categories: [],
    warehouses: [],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, filtersRes] = await Promise.all([
        analyticsService.getInventory({
          warehouse: selectedWarehouse,
          category: selectedCategory,
        }),
        analyticsService.getFilters(),
      ]);
      setData(invRes);
      setFilterOptions(filtersRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, selectedCategory]);

  const kpis = data?.kpis;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Module 7</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-500">在庫・需給分析</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Inventory & Supply Chain Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Logistics hub stock monitoring, low-stock threshold detection, reorder planning, and warehouse valuations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Inventory Sheet</span>
          </button>
          <button
            onClick={fetchData}
            title="Refresh inventory from PostgreSQL"
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
          <span className="text-slate-600 font-medium">Warehouse Hub:</span>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="p-1.5 border border-slate-300 rounded-md bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Regional Warehouses</option>
            {filterOptions.warehouses.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
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
      </div>

      {/* Empty State */}
      {!data?.has_data ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No inventory dataset loaded. Connect a data source or upload a dataset.
          </h3>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mt-2">
            In compliance with strict real-data rules, inventory valuation and low-stock alerts require actual records.
          </p>

          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-md mx-auto text-left text-xs">
            <span className="font-semibold text-slate-700 block mb-2">Required Columns:</span>
            <ul className="space-y-1 font-mono text-slate-600 text-[11px]">
              <li>• product_id (string)</li>
              <li>• product_name (string)</li>
              <li>• category (string)</li>
              <li>• available_quantity (integer &gt;= 0)</li>
              <li>• reorder_level (integer &gt;= 0)</li>
              <li>• unit_cost (float &gt;= 0.0)</li>
              <li>• warehouse (string)</li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/upload')}
            className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs inline-flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Inventory Spreadsheet</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Tracked SKUs</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {(kpis?.total_skus ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Active inventory master records</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Units on Hand</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {(kpis?.total_units_on_hand ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total physical stock in depots</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Stock Valuation</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                ¥{(kpis?.total_inventory_valuation ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Σ(available_qty × unit_cost)</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <span className="text-xs font-medium text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Low Stock Threshold Alerts
              </span>
              <div className="text-2xl font-bold text-rose-700 font-mono mt-1">
                {(kpis?.low_stock_sku_count ?? 0)} SKUs
              </div>
              <p className="text-[11px] text-rose-600 mt-1">
                {(kpis?.stockout_count ?? 0) > 0 ? `${kpis.stockout_count} Stockout items` : 'available_qty <= reorder_level'}
              </p>
            </div>
          </div>

          {/* Section: Low Stock Alerts & Actionable Reorder Plan */}
          {kpis.low_stock_sku_count > 0 && (
            <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Low Stock Detection & Reorder Planning
                  </h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Triggered condition: <code>available_quantity &lt;= reorder_level</code>. Safety stock target: 2× reorder level.
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-1.5 text-xs text-rose-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-rose-600" />
                  <span>Estimated Replenishment Budget:</span>
                  <span className="font-bold font-mono">¥{(kpis?.reorder_budget_required ?? 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-rose-50 text-rose-800 border-b border-rose-200">
                    <tr>
                      <th className="p-2.5">SKU ID</th>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5">Warehouse Location</th>
                      <th className="p-2.5 text-right">Current Stock</th>
                      <th className="p-2.5 text-right">Reorder Level</th>
                      <th className="p-2.5">Priority</th>
                      <th className="p-2.5 text-right">Suggested Order</th>
                      <th className="p-2.5 text-right">Estimated Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {data.reorder_recommendations.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-rose-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{item.product_id}</td>
                        <td className="p-2.5 font-medium text-slate-900">{item.product_name}</td>
                        <td className="p-2.5 text-slate-600">{item.warehouse}</td>
                        <td className="p-2.5 text-right font-bold text-rose-600">{item.available_quantity}</td>
                        <td className="p-2.5 text-right text-slate-600">{item.reorder_level}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              item.urgency_badge === 'critical'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : item.urgency_badge === 'high'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            {item.urgency}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          +{item.suggested_reorder_qty} units
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">
                          ¥{(item.estimated_reorder_cost ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warehouse Hub Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Regional Warehouse Hub Distribution
              </h3>
              <p className="text-xs text-slate-500 mb-4">Stock count and valuation by logistics depot</p>

              <div className="space-y-3">
                {data.warehouse_breakdown.map((wh: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                      <span>{wh.warehouse}</span>
                      <span className="font-mono text-blue-600">¥{(wh.total_valuation ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                      <span>{wh.sku_count} SKUs ({(wh.total_units ?? 0).toLocaleString()} total units)</span>
                      {wh.low_stock_count > 0 ? (
                        <span className="text-rose-600 font-semibold">{wh.low_stock_count} Low Stock</span>
                      ) : (
                        <span className="text-emerald-600">Stock Healthy</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Valuation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Category Stock Valuation
              </h3>
              <p className="text-xs text-slate-500 mb-4">Valuation distributed across group operations</p>

              <div className="space-y-3">
                {data.category_breakdown.map((cat: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                      <span>{cat.category}</span>
                      <span className="font-mono text-emerald-700">¥{(cat.total_valuation ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                      <span>{cat.sku_count} SKUs</span>
                      <span>{(cat.total_units ?? 0).toLocaleString()} Units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full SKU Inventory Catalog */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Full Inventory Master Catalog</h3>
            <p className="text-xs text-slate-500 mb-4">
              All physical SKUs tracked in the centralized PostgreSQL inventory table.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">SKU ID</th>
                    <th className="p-2.5">Product / Item Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Warehouse Location</th>
                    <th className="p-2.5 text-right">Available Qty</th>
                    <th className="p-2.5 text-right">Reorder Level</th>
                    <th className="p-2.5 text-right">Unit Cost</th>
                    <th className="p-2.5 text-right">Total Valuation</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.all_items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-blue-600">{item.product_id}</td>
                      <td className="p-2.5 font-medium text-slate-900">{item.product_name}</td>
                      <td className="p-2.5">{item.category}</td>
                      <td className="p-2.5 text-slate-600">{item.warehouse}</td>
                      <td className="p-2.5 text-right font-semibold">{item.available_quantity}</td>
                      <td className="p-2.5 text-right text-slate-500">{item.reorder_level}</td>
                      <td className="p-2.5 text-right text-slate-600">¥{(item.unit_cost ?? 0).toLocaleString()}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        ¥{(item.valuation ?? 0).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            item.is_low_stock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.is_low_stock ? 'Low Stock' : 'Optimal'}
                        </span>
                      </td>
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
