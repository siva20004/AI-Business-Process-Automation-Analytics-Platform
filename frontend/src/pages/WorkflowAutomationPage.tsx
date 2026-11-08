import React, { useState, useEffect } from 'react';
import { workflowService } from '../services/api';
import {
  GitBranch,
  Play,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  Database,
  Calculator,
  Mail,
  FileText,
  Activity,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PIPELINE_STEP_ICONS: Record<string, any> = {
  read_source: FileSpreadsheet,
  validate_contract: ShieldCheck,
  clean_data: RefreshCw,
  store_postgresql: Database,
  calculate_analytics: Calculator,
  detect_anomalies: AlertTriangle,
  generate_report: FileText,
  prepare_email: Mail,
};

export const WorkflowAutomationPage: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  // New Workflow Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('scheduled');
  const [cron, setCron] = useState('0 2 * * *');

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleRun = async (id: number) => {
    setRunningId(id);
    setExecutionResult(null);
    try {
      const res = await workflowService.runWorkflow(id);
      setExecutionResult(res);
      fetchWorkflows();
    } catch (e: any) {
      setExecutionResult({
        status: 'failed',
        error_message: e.response?.data?.detail || 'Pipeline execution failed.',
        steps: [],
      });
    } finally {
      setRunningId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workflowService.createWorkflow({
        name,
        description,
        trigger_type: triggerType,
        schedule_cron: cron,
        is_active: true,
      });
      setShowModal(false);
      setName('');
      setDescription('');
      fetchWorkflows();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Module 5</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-500">ワークフロー自動化エンジン</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Workflow Automation Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic orchestration of ingest, contract validation, database persistence, metric computation, and report generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workflow-history')}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Execution History Logs</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Visual Workflow Pipeline Architecture Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-600" />
          Fuji Flow Canonical Enterprise Pipeline Architecture
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Every workflow step performs genuine Python and PostgreSQL operations. If any mandatory step encounters an anomaly or contract violation, execution is halted and diagnosed.
        </p>

        {/* Horizontal Step Flow Diagram */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[780px] gap-2">
            {[
              { id: 'read_source', label: '1. Ingest Source', sub: 'CSV/Excel/JSON' },
              { id: 'validate_contract', label: '2. Contract Check', sub: 'Math & Schema' },
              { id: 'clean_data', label: '3. Data Cleaning', sub: 'Sanitize & Types' },
              { id: 'store_postgresql', label: '4. DB Storage', sub: 'PostgreSQL Store' },
              { id: 'calculate_analytics', label: '5. Analytics Agg', sub: 'Sales & Stock' },
              { id: 'detect_anomalies', label: '6. Outlier Scan', sub: 'Z-Score / Stat' },
              { id: 'generate_report', label: '7. Report Build', sub: 'CSV / Audit' },
              { id: 'prepare_email', label: '8. Notification', sub: 'Email Dispatch' },
            ].map((st, i, arr) => (
              <React.Fragment key={st.id}>
                <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-200 text-center min-w-[100px] shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mb-1.5 font-bold text-xs">
                    {i + 1}
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">{st.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{st.sub}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Execution Diagnostics Display */}
      {executionResult && (
        <div
          className={`p-5 rounded-xl border shadow-xs ${
            executionResult.status === 'success'
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-rose-50/50 border-rose-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                  executionResult.status === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {executionResult.status === 'success' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  Execution Run: <span className="font-mono">{executionResult.execution_id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      executionResult.status === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {executionResult.status}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Duration: <strong className="font-mono">{executionResult.duration_seconds}s</strong> | Records Ingested: <strong className="font-mono">{executionResult.records_processed}</strong>
                </p>
              </div>
            </div>

            {executionResult.failed_step && (
              <div className="bg-white p-3 rounded-lg border border-rose-200 text-xs text-rose-900">
                <span className="font-bold block">Failed Step: {executionResult.failed_step}</span>
                <span className="text-[11px] text-rose-700">{executionResult.error_message}</span>
              </div>
            )}
          </div>

          {/* Stepper Results Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60">
            {executionResult.steps?.map((st: any, idx: number) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs ${
                  st.status === 'success'
                    ? 'bg-white border-emerald-200 text-slate-800'
                    : 'bg-rose-100/50 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold truncate text-[11px]">{st.name || st.step_id}</span>
                  <span className="font-mono text-[10px] text-slate-400">{st.duration_ms}ms</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate" title={st.message || st.error}>
                  {st.message || st.error}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Configured Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {workflows.map((wf) => {
          const isRunning = runningId === wf.id;

          return (
            <div
              key={wf.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <GitBranch className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{wf.name}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Trigger: <strong className="text-slate-700 uppercase">{wf.trigger_type}</strong>
                        {wf.schedule_cron && ` (${wf.schedule_cron})`}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      wf.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {wf.is_active ? 'Active Schedule' : 'Paused'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4">{wf.description}</p>

                {/* Steps tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {wf.steps_config?.map((sc: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200"
                    >
                      {sc.name || sc.id}
                    </span>
                  ))}
                </div>

                {/* Last Run Info */}
                {wf.last_execution && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono flex items-center justify-between text-slate-600 mb-4">
                    <span>Last Run: {wf.last_execution.execution_id}</span>
                    <span
                      className={`font-bold uppercase ${
                        wf.last_execution.status === 'success'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {wf.last_execution.status} ({wf.last_execution.duration_seconds}s)
                    </span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">ID #{wf.id}</span>
                <button
                  onClick={() => handleRun(wf.id)}
                  disabled={isRunning}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Executing Pipeline...' : 'Run Pipeline Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Workflow Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Automated Workflow</h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure a trigger and pipeline sequence for continuous business execution.
            </p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workflow Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fuji-Q Highland Nightly Ticket Settlement"
                  className="w-full text-xs p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding dataset target and execution schedule..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trigger Type</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md"
                >
                  <option value="scheduled">Scheduled Chronological Execution (Cron)</option>
                  <option value="manual">Manual Execution Only</option>
                  <option value="file_upload">File Ingestion Event Trigger</option>
                </select>
              </div>

              {triggerType === 'scheduled' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cron Expression</label>
                  <input
                    type="text"
                    value={cron}
                    onChange={(e) => setCron(e.target.value)}
                    placeholder="0 2 * * * (Every night at 2:00 AM)"
                    className="w-full text-xs p-2 border border-slate-300 rounded-md font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Format: minute hour day month day_of_week</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs"
                >
                  Save & Register Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
