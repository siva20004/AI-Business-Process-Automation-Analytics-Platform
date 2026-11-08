import React, { useState, useEffect } from 'react';
import { uploadService } from '../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Calculator,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DataCleaningValidationPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await uploadService.getHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Module 4</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-500">データクレンジング・検証エンジン</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Data Cleaning & Validation Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic data contract enforcement, whitespace removal, type standardization, duplicate prevention, and formula validation.
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Upload Dataset for Validation</span>
        </button>
      </div>

      {/* Active Data Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Contract */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Sales Transactions Contract</h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active Contract
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Enforces strict relational integrity and business calculation accuracy on operational POS, ticket, and booking logs.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-700">transaction_id:</span>
              <span className="text-blue-600">Unique string (duplicate rejection)</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-700">transaction_date:</span>
              <span className="text-blue-600">ISO 8601 UTC Valid Timestamp</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-700">quantity:</span>
              <span className="text-blue-600">Integer greater than zero (qty &gt; 0)</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-700">unit_price:</span>
              <span className="text-blue-600">Non-negative numerical value</span>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
              <span className="font-semibold block mb-0.5">Mathematical Verification Rule:</span>
              <span>total_amount == quantity × unit_price (flags mismatch)</span>
            </div>
          </div>
        </div>

        {/* Inventory Contract */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Warehouse Inventory Contract</h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active Contract
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Governs SKU items, logistical warehouses, stock counting, and reorder trigger boundaries.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-700">product_id:</span>
              <span className="text-blue-600">Required unique SKU string</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-700">available_quantity:</span>
              <span className="text-blue-600">Non-negative integer (stock count)</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-700">reorder_level:</span>
              <span className="text-blue-600">Threshold integer (low stock trigger)</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-700">warehouse:</span>
              <span className="text-blue-600">Logistics depot or retail store</span>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200 text-indigo-900">
              <span className="font-semibold block mb-0.5">Automated Low Stock Condition:</span>
              <span>available_quantity &lt;= reorder_level (flags for replenishment)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Cleaning Pipeline Specifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          Automated Python Cleaning Engine Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1">1. String Trimming & Sanitation</h4>
            <p className="text-slate-500">
              Strips leading/trailing whitespace, invisible tabs, and non-printable control characters across all columns.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1">2. Column Name Normalization</h4>
            <p className="text-slate-500">
              Translates varying CSV headers into standardized <code>lower_snake_case</code> matching database column schemas.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1">3. ISO 8601 & Number Coercion</h4>
            <p className="text-slate-500">
              Removes currency markers (<code>¥</code>, <code>$</code>, commas), converts to IEEE 754 floats, and unifies dates into UTC.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Audit Reports & Cleaned Datasets */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Validation Audits & Cleaned Datasets</h3>
            <p className="text-xs text-slate-500">
              Downloadable audit reports detailing all rejected rows, duplicates, and math formula flags.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center p-8 text-xs text-slate-400">
            No validation runs yet. Head to Data Upload Center to stage your first file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Import ID</th>
                  <th className="p-2.5">Dataset File</th>
                  <th className="p-2.5 text-right">Valid Rows</th>
                  <th className="p-2.5 text-right">Quarantined Rows</th>
                  <th className="p-2.5">Database Status</th>
                  <th className="p-2.5 text-right">Download Cleaned</th>
                  <th className="p-2.5 text-right">Download Audit Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h: any) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-400">#{h.id}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{h.file_name}</td>
                    <td className="p-2.5 text-right text-emerald-600 font-semibold">{h.valid_records}</td>
                    <td className="p-2.5 text-right text-rose-600 font-semibold">{h.invalid_records}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {h.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <a
                        href={`/api/v1/uploads/${h.id}/cleaned-file`}
                        download
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Cleaned CSV
                      </a>
                    </td>
                    <td className="p-2.5 text-right">
                      {h.has_report ? (
                        <a
                          href={`/api/v1/uploads/${h.id}/report`}
                          download
                          className="text-rose-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Issues Report
                        </a>
                      ) : (
                        <span className="text-slate-400">Zero Issues</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
