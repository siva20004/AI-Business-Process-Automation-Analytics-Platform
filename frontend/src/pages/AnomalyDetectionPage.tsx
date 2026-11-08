import React, { useState, useEffect } from 'react';
import { anomalyService } from '../services/api';
import {
  AlertTriangle,
  ShieldCheck,
  Search,
  RefreshCw,
  Cpu,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  Database,
  Sliders,
  Filter
} from 'lucide-react';

export const AnomalyDetectionPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAnomaly, setSelectedAnomaly] = useState<any | null>(null);

  // Review modal state
  const [reviewStatus, setReviewStatus] = useState<string>('reviewed');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anomList, statsData] = await Promise.all([
        anomalyService.getAnomalies({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          record_type: typeFilter !== 'all' ? typeFilter : undefined,
        }),
        anomalyService.getStats(),
      ]);
      setAnomalies(anomList);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await anomalyService.triggerScan();
      alert(`Anomaly Scan Complete!\nAnalyzed: ${res.total_analyzed} records\nNew Flagged: ${res.new_anomalies}\nActive Alerts: ${res.total_anomalies}`);
      await fetchData();
    } catch (err: any) {
      alert(`Scan failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedAnomaly) return;
    setSubmittingReview(true);
    try {
      await anomalyService.reviewAnomaly(selectedAnomaly.id, reviewStatus, reviewNotes);
      setSelectedAnomaly(null);
      setReviewNotes('');
      await fetchData();
    } catch (err: any) {
      alert(`Failed to submit review: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
              Module 8 • AI異常検知エンジン
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Scikit-Learn Isolation Forest & Z-Score (&gt;2.5σ)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1C3F] mt-1">
            Operational Anomaly Detection & Audit
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Strict Real-Data Mandate: Detects price divergence, revenue outliers, and stockout threats from live PostgreSQL transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F1C3F] hover:bg-[#1A2E66] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Cpu className={`w-4 h-4 text-rose-400 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Running ML Models...' : 'Run Anomaly Scan'}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Anomalies</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {stats?.total_anomalies ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Grounded in database transactions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unreviewed Alerts</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {stats?.unreviewed ?? 0}
          </div>
          <p className="text-xs text-amber-600 font-medium mt-1">Pending controller inspection</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reviewed / Cleared</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {(stats?.reviewed ?? 0) + (stats?.dismissed ?? 0)}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Human audit verified</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model Distribution</span>
            <Cpu className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-800">
            {stats?.method_breakdown?.length ? `${stats.method_breakdown.length} Active Algorithms` : 'Isolation Forest / Z-Score'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Unsupervised ML & Statistics</p>
        </div>
      </div>

      {/* Main Anomaly Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/75 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">Flagged Anomaly Audit Register</h2>
            <span className="text-xs font-mono text-slate-500">
              ({anomalies.length} {anomalies.length === 1 ? 'alert' : 'alerts'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Record Types</option>
              <option value="transaction">Transactions Only</option>
              <option value="inventory">Inventory Only</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Review Statuses</option>
              <option value="unreviewed">Unreviewed Only</option>
              <option value="reviewed">Reviewed Only</option>
              <option value="dismissed">Dismissed Only</option>
            </select>
          </div>
        </div>

        {/* Empty state or Table */}
        {anomalies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-3 border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No anomalies detected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              All transaction records fall within category statistical baselines. Click "Run Anomaly Scan" to evaluate recent ingested data with Isolation Forest.
            </p>
            <button
              onClick={handleRunScan}
              disabled={scanning}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Cpu className="w-3.5 h-3.5" />
              Trigger Anomaly Model Scan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Detection Algorithm</th>
                  <th className="py-3 px-4 text-right">Observed Value</th>
                  <th className="py-3 px-4 text-right">Baseline Reference</th>
                  <th className="py-3 px-4">Explainable Reason</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anomalies.map((anom) => {
                  const isUnreviewed = anom.status === 'unreviewed';
                  const isReviewed = anom.status === 'reviewed';
                  const isDismissed = anom.status === 'dismissed';

                  return (
                    <tr
                      key={anom.id}
                      className="hover:bg-rose-50/30 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedAnomaly(anom);
                        setReviewStatus(anom.status);
                        setReviewNotes(anom.raw_record?.review_notes || '');
                      }}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">
                        {anom.record_id}
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                          {anom.record_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {anom.detection_method}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ¥{anom.observed_value?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {anom.reference_baseline != null ? `¥${anom.reference_baseline.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={anom.reason}>
                        {anom.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            isUnreviewed
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isReviewed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isUnreviewed && <AlertCircle className="w-3 h-3" />}
                          {isReviewed && <CheckCircle className="w-3 h-3" />}
                          {isDismissed && <XCircle className="w-3 h-3" />}
                          {anom.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnomaly(anom);
                            setReviewStatus(anom.status);
                            setReviewNotes(anom.raw_record?.review_notes || '');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded text-[11px] transition-colors"
                        >
                          Audit Review
                          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Review Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Record ID: {selectedAnomaly.record_id}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 capitalize font-medium">
                    {selectedAnomaly.record_type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Human Audit Review & Anomaly Explainability
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Algorithmic Reason Box */}
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                  <Cpu className="w-4 h-4 text-rose-600" />
                  Algorithm: {selectedAnomaly.detection_method}
                </div>
                <p className="mt-2 text-xs text-rose-900 leading-relaxed font-sans">
                  {selectedAnomaly.reason}
                </p>
              </div>

              {/* Numerical Divergence Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Observed Value</span>
                  <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    ¥{selectedAnomaly.observed_value?.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Baseline Reference</span>
                  <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    {selectedAnomaly.reference_baseline != null
                      ? `¥${selectedAnomaly.reference_baseline.toLocaleString()}`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Raw Record Metadata */}
              {selectedAnomaly.raw_record && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-slate-600" />
                    Underlying Transaction Context
                  </h4>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40 leading-relaxed">
                    {JSON.stringify(selectedAnomaly.raw_record, null, 2)}
                  </pre>
                </div>
              )}

              {/* Review Action Form */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Auditor Decision & Notes
                </h4>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Resolution Status
                  </label>
                  <div className="flex gap-2">
                    {[
                      { val: 'reviewed', label: 'Mark Reviewed (Legitimate Outlier)' },
                      { val: 'dismissed', label: 'Dismiss (False Positive)' },
                      { val: 'escalated', label: 'Escalate to Accounting' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setReviewStatus(opt.val)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                          reviewStatus === opt.val
                            ? 'bg-[#0F1C3F] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Reviewer Audit Notes / Justification
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Verified corporate group ticket booking approved by management..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                {selectedAnomaly.reviewed_by ? `Last reviewed by: ${selectedAnomaly.reviewed_by}` : 'Status: Pending Review'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={submittingReview}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                >
                  {submittingReview ? 'Submitting...' : 'Save Audit Decision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
