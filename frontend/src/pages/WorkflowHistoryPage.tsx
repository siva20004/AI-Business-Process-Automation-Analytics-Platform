import React, { useState, useEffect } from 'react';
import { workflowService } from '../services/api';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  RotateCcw,
  Activity,
  Layers,
  FileText,
  X,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const WorkflowHistoryPage: React.FC = () => {
  const [executions, setExecutions] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [execList, statsData] = await Promise.all([
        workflowService.getExecutions(100),
        workflowService.getStats(),
      ]);
      setExecutions(execList);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load workflow execution history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = async (executionId: string) => {
    setRetryingId(executionId);
    try {
      const result = await workflowService.retryExecution(executionId);
      // Refresh list and select the retried/new execution
      await fetchData();
      setSelectedExecution(result);
    } catch (err: any) {
      alert(`Retry failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const filteredExecutions = executions.filter((ex) => {
    if (filterStatus === 'all') return true;
    return ex.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Module 12 • 実行ログ・監視
            </span>
            <span className="text-xs text-slate-400 font-mono">APScheduler & Audit Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1C3F] mt-1">
            Workflow Execution History & Logs
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time execution telemetry, duration tracking, step diagnostics, and failure recovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          <Link
            to="/workflows"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F1C3F] hover:bg-[#1A2E66] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Play className="w-4 h-4 text-blue-400" />
            Launch Workflow
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Executions</span>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {stats?.total_executions ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Audit log runs registered in DB</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Success Rate</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {stats?.success_rate_percent ?? 0}%
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            {stats?.successful_executions ?? 0} completed successfully
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed Runs</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {stats?.failed_executions ?? 0}
          </div>
          <p className="text-xs text-rose-600 mt-1 font-medium">Require retry or remediation</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Duration</span>
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {stats?.avg_duration_seconds != null ? `${stats.avg_duration_seconds}s` : '0.00s'}
          </div>
          <p className="text-xs text-slate-500 mt-1">End-to-end processing latency</p>
        </div>
      </div>

      {/* Main Table / History */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/75 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Execution Audit Log</h2>
            <span className="text-xs font-mono text-slate-500">
              ({filteredExecutions.length} {filteredExecutions.length === 1 ? 'record' : 'records'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Filter:</span>
            {['all', 'success', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                  filterStatus === st
                    ? 'bg-[#0F1C3F] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredExecutions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No execution logs found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Workflows run automatically on schedule or manually from the Workflow Automation builder.
            </p>
            <Link
              to="/workflows"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              Go to Workflow Engine
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Execution ID</th>
                  <th className="py-3 px-4">Workflow</th>
                  <th className="py-3 px-4">Trigger</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Records</th>
                  <th className="py-3 px-4">Executed At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExecutions.map((ex) => {
                  const isSuccess = ex.status?.toLowerCase() === 'success';
                  const isFailed = ex.status?.toLowerCase() === 'failed';

                  return (
                    <tr
                      key={ex.execution_id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedExecution(ex)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {ex.execution_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {ex.workflow_name || 'Standard Automation'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 capitalize">
                        {ex.trigger_type || 'manual'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isFailed
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isFailed && <AlertTriangle className="w-3.5 h-3.5" />}
                          {ex.status.toUpperCase()}
                        </span>
                        {isFailed && ex.failed_step && (
                          <span className="block text-[10px] text-rose-600 font-mono mt-0.5">
                            Step: {ex.failed_step}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {ex.duration_seconds != null ? `${ex.duration_seconds.toFixed(2)}s` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {ex.records_processed ?? 0}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {ex.start_time
                          ? new Date(ex.start_time).toLocaleString('ja-JP', {
                              timeZone: 'Asia/Tokyo',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isFailed && (
                            <button
                              onClick={() => handleRetry(ex.execution_id)}
                              disabled={retryingId === ex.execution_id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded shadow-xs text-[11px] transition-colors"
                              title="Retry pipeline with same configuration"
                            >
                              <RotateCcw
                                className={`w-3 h-3 ${
                                  retryingId === ex.execution_id ? 'animate-spin' : ''
                                }`}
                              />
                              Retry
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedExecution(ex)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition-colors"
                          >
                            Logs
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Execution Diagnostics Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {selectedExecution.execution_id}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedExecution.status?.toLowerCase() === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedExecution.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Pipeline Execution Diagnostic & Logs
                </h3>
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Telemetry Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {selectedExecution.duration_seconds != null
                      ? `${selectedExecution.duration_seconds.toFixed(2)}s`
                      : '0s'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Records Processed</span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {selectedExecution.records_processed ?? 0}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Started At</span>
                  <p className="font-mono text-slate-700 text-[11px] mt-0.5">
                    {selectedExecution.start_time
                      ? new Date(selectedExecution.start_time).toLocaleTimeString('ja-JP')
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Completed At</span>
                  <p className="font-mono text-slate-700 text-[11px] mt-0.5">
                    {selectedExecution.end_time
                      ? new Date(selectedExecution.end_time).toLocaleTimeString('ja-JP')
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Error Alert if Failed */}
              {selectedExecution.error_message && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Failed Step: {selectedExecution.failed_step || 'Unknown'}
                  </div>
                  <pre className="mt-2 text-[11px] font-mono text-rose-800 bg-rose-100/50 p-2.5 rounded border border-rose-200 overflow-x-auto whitespace-pre-wrap">
                    {selectedExecution.error_message}
                  </pre>
                </div>
              )}

              {/* Step By Step Results */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Step Execution Audit Trail
                </h4>
                {selectedExecution.step_results &&
                Object.keys(selectedExecution.step_results).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(selectedExecution.step_results).map(
                      ([stepName, stepData]: [string, any], idx) => {
                        const isStepOk = stepData.status === 'success';
                        return (
                          <div
                            key={stepName}
                            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                              isStepOk
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-rose-50/40 border-rose-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-400">
                                0{idx + 1}
                              </span>
                              {isStepOk ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                              <span className="font-mono font-bold text-slate-800">{stepName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {stepData.duration_seconds != null && (
                                <span className="font-mono text-slate-500 text-[11px]">
                                  {stepData.duration_seconds}s
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  isStepOk
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {stepData.status}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-slate-500 font-mono text-center">
                    No individual step breakdown available for this run.
                  </div>
                )}
              </div>

              {/* Logs */}
              {selectedExecution.logs && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    Console Output / Log Trace
                  </h4>
                  <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                    {Array.isArray(selectedExecution.logs)
                      ? selectedExecution.logs.join('\n')
                      : selectedExecution.logs}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Enterprise Process Automation Audit Log
              </span>
              <div className="flex items-center gap-2">
                {selectedExecution.status?.toLowerCase() === 'failed' && (
                  <button
                    onClick={() => handleRetry(selectedExecution.execution_id)}
                    disabled={retryingId === selectedExecution.execution_id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm text-xs transition-colors"
                  >
                    <RotateCcw
                      className={`w-3.5 h-3.5 ${
                        retryingId === selectedExecution.execution_id ? 'animate-spin' : ''
                      }`}
                    />
                    Retry Execution
                  </button>
                )}
                <button
                  onClick={() => setSelectedExecution(null)}
                  className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
