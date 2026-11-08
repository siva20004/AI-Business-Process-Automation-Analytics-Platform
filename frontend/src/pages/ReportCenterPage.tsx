import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import {
  FileText,
  Download,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
  Database,
  Calendar,
  Filter,
  ExternalLink
} from 'lucide-react';

export const ReportCenterPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>('executive_briefing');
  const [fileFormat, setFileFormat] = useState<string>('pdf');
  const [timeRange, setTimeRange] = useState<string>('all');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReports(100);
      setReports(data);
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await reportService.generateReport({
        report_type: reportType,
        file_format: fileFormat,
        time_range: timeRange,
      });
      setShowModal(false);
      await fetchReports();
      // Auto open or offer download
      window.open(reportService.downloadReportUrl(res.report_id), '_blank');
    } catch (err: any) {
      alert(`Report compilation failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Module 10 • 自動レポート生成センター
            </span>
            <span className="text-xs text-slate-400 font-mono">ReportLab PDF & OpenPyXL Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1C3F] mt-1">
            Corporate Report Center & Document Archive
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Strict Real-Data Mandate: Generates audit-ready PDF, multi-tab Excel, and Power BI CSV exports grounded in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F1C3F] hover:bg-[#1A2E66] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            Generate New Report
          </button>
        </div>
      </div>

      {/* Report Categories Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Archive Size</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {reports.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Compiled documents in storage</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PDF Compilations</span>
            <FileText className="w-5 h-5 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {reports.filter((r) => r.file_format === 'pdf').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">ReportLab enterprise layouts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Excel Workbooks</span>
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {reports.filter((r) => r.file_format === 'xlsx').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Multi-tab OpenPyXL workbooks</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CSV Data Feeds</span>
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {reports.filter((r) => r.file_format === 'csv').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Power BI ready (UTF-8 with BOM)</p>
        </div>
      </div>

      {/* Main Reports List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Generated Reports Archive</h2>
            <span className="text-xs font-mono text-slate-500">
              ({reports.length} {reports.length === 1 ? 'file' : 'files'})
            </span>
          </div>
          <span className="text-xs text-slate-500">All downloads stream directly from disk</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No reports generated yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Select "Generate New Report" to compile a PDF executive briefing, multi-tab Excel spreadsheet, or Power BI dataset.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Compile First Report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Report Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Records Analyzed</th>
                  <th className="py-3 px-4">Generated By</th>
                  <th className="py-3 px-4">Date (JST)</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => {
                  const isPdf = r.file_format === 'pdf';
                  const isXlsx = r.file_format === 'xlsx';

                  return (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {r.title}
                        <span className="block text-[11px] font-mono text-slate-400 font-normal">
                          {r.filename}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize">
                        {r.report_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                            isPdf
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isXlsx
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {r.file_format}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {r.records_analyzed ?? 0}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {r.created_by || 'System Automation'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString('ja-JP', {
                              timeZone: 'Asia/Tokyo',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={reportService.downloadReportUrl(r.id)}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F1C3F] hover:bg-[#1A2E66] text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-300" />
                          Download
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Generation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Generate Corporate Report
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select report type, export format, and temporal scope. Real PostgreSQL calculations are compiled directly.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="executive_briefing">Executive Integrated Performance Briefing</option>
                  <option value="daily_sales">Commercial Sales & Category Breakdown</option>
                  <option value="inventory_status">Multi-Facility Inventory & Reorder Audit</option>
                  <option value="anomaly_audit">AI Anomaly & Outlier Audit Trail</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pdf', label: 'PDF Document', desc: 'ReportLab Layout' },
                    { id: 'xlsx', label: 'Excel Workbook', desc: 'Multi-Tab Sheets' },
                    { id: 'csv', label: 'Power BI CSV', desc: 'UTF-8 with BOM' },
                  ].map((fmt) => (
                    <button
                      type="button"
                      key={fmt.id}
                      onClick={() => setFileFormat(fmt.id)}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        fileFormat === fmt.id
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <p className="font-bold text-xs">{fmt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{fmt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Reporting Scope
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Available Historical Transactions</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="today">Today</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-[#0F1C3F] hover:bg-[#1A2E66] text-white font-bold rounded-lg shadow-sm transition-colors"
                >
                  {generating ? 'Compiling Document...' : 'Generate & Download'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
