import React, { useEffect, useState } from 'react';
import { dataSourceService } from '../services/api';
import { DataSource, DataSourceTestResult } from '../types';
import {
  Database,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Server,
  Activity,
  Layers,
  Info
} from 'lucide-react';

export const DataSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, DataSourceTestResult>>({});
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'csv' | 'excel' | 'postgresql' | 'rest_api'>('postgresql');
  const [newHost, setNewHost] = useState('localhost');
  const [newPort, setNewPort] = useState('5432');
  const [newDb, setNewDb] = useState('fuji_flow');

  const fetchSources = async () => {
    setLoading(true);
    try {
      const data = await dataSourceService.getAll();
      setSources(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const result = await dataSourceService.testConnection(id);
      setTestResults((prev) => ({ ...prev, [id]: result }));
      // Refresh list to pick up updated status and last_sync
      fetchSources();
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: false,
          status: 'error',
          message: e.response?.data?.detail || 'Connection test failed',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataSourceService.create({
        name: newName,
        source_type: newType,
        connection_config:
          newType === 'postgresql'
            ? { server: newHost, port: parseInt(newPort), database: newDb }
            : { path: './data/uploads' },
      });
      setShowModal(false);
      setNewName('');
      fetchSources();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Module 2</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-500">データソース統合管理</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Data Sources Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure, verify and monitor authorized connections across databases, local repositories, and APIs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Connection</span>
          </button>
          <button
            onClick={fetchSources}
            title="Refresh Sources"
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Information Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Strict Real Connection Standard:</span> A data source is only marked as{' '}
          <strong className="text-emerald-700">CONNECTED</strong> after an active handshake is verified via a live network query.
          Credentials and connection parameters are securely isolated in backend configurations.
        </div>
      </div>

      {/* Data Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sources.map((src) => {
          const testRes = testResults[src.id];
          const isTesting = testingId === src.id;

          return (
            <div key={src.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                      {src.source_type === 'postgresql' ? (
                        <Server className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{src.name}</h3>
                      <span className="text-[11px] font-mono uppercase text-slate-400">
                        Type: {src.source_type}
                      </span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                      src.status === 'connected'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : src.status === 'error'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        src.status === 'connected'
                          ? 'bg-emerald-500'
                          : src.status === 'error'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    {src.status}
                  </span>
                </div>

                {/* Configuration Details */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs font-mono space-y-1 mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Config:</span>
                    <span className="truncate max-w-[240px]">
                      {JSON.stringify(src.connection_config)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Record Count:</span>
                    <span className="font-semibold text-slate-800">{(src.record_count ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Last Verified:</span>
                    <span>
                      {src.last_sync_at
                        ? new Date(src.last_sync_at).toLocaleString()
                        : 'Not tested yet'}
                    </span>
                  </div>
                </div>

                {/* Test Feedback Notice */}
                {testRes && (
                  <div
                    className={`p-3 rounded-lg text-xs mb-4 flex items-start gap-2 ${
                      testRes.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {testRes.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{testRes.message}</p>
                      {testRes.latency_ms !== undefined && (
                        <p className="text-[10px] opacity-80 mt-0.5">Roundtrip Latency: {testRes.latency_ms}ms</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">ID #{src.id}</span>
                <button
                  onClick={() => handleTest(src.id)}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 text-blue-600 ${isTesting ? 'animate-pulse' : ''}`} />
                  <span>{isTesting ? 'Testing Handshake...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add New Data Source</h3>
            <p className="text-xs text-slate-500 mb-4">
              Register an authorized database or file feed for Fuji Flow pipeline processing.
            </p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Fuji-Q Highland POS Database"
                  className="w-full text-xs p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Type</label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="postgresql">PostgreSQL Database Connection</option>
                  <option value="csv">CSV Staging Folder</option>
                  <option value="excel">Excel Repository</option>
                  <option value="rest_api">Authorized REST API Endpoint</option>
                </select>
              </div>

              {newType === 'postgresql' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Host</label>
                    <input
                      type="text"
                      value={newHost}
                      onChange={(e) => setNewHost(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                    <input
                      type="text"
                      value={newPort}
                      onChange={(e) => setNewPort(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Database Name</label>
                    <input
                      type="text"
                      value={newDb}
                      onChange={(e) => setNewDb(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-md"
                    />
                  </div>
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
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
