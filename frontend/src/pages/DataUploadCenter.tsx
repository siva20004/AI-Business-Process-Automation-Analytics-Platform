import React, { useState, useEffect } from 'react';
import { uploadService } from '../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  Database,
  RefreshCw,
  Download,
  Info,
  Check,
  X,
  History,
  Layers,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ColumnInfo {
  name: string;
  inferred_type: string;
  null_count: number;
  unique_count: number;
}

interface ValidationSummary {
  contract: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  missing_values: number;
  math_mismatches: number;
  total_issues: number;
}

export const DataUploadCenter: React.FC = () => {
  const navigate = useNavigate();

  // Wizard State
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // File & Preview State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewMeta, setPreviewMeta] = useState<any | null>(null);
  const [samples, setSamples] = useState<any[]>([]);

  // Contract & Mapping State
  const [contractType, setContractType] = useState<'sales' | 'inventory'>('sales');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Validation Results State
  const [valResults, setValResults] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'valid' | 'invalid' | 'operations'>('valid');

  // Confirmation State
  const [confirming, setConfirming] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistoryAndSamples = async () => {
    try {
      const [hist, smp] = await Promise.all([
        uploadService.getHistory(),
        uploadService.getSamples(),
      ]);
      setHistory(hist);
      setSamples(smp);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistoryAndSamples();
  }, []);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Step 1 -> Step 2: Preview
  const handlePreview = async (samplePath?: string) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (samplePath) {
        formData.append('sample_path', samplePath);
      } else if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        setError('Please select a file or sample dataset.');
        setLoading(false);
        return;
      }

      const meta = await uploadService.preview(formData);
      setPreviewMeta(meta);

      // Auto-detect contract type based on columns
      const colNames = meta.columns.map((c: ColumnInfo) => c.name.toLowerCase());
      if (colNames.some((c: string) => c.includes('available_quantity') || c.includes('warehouse'))) {
        setContractType('inventory');
      } else {
        setContractType('sales');
      }

      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to inspect file.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Run Cleaning and Validation
  const handleValidate = async () => {
    if (!previewMeta) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file_path', previewMeta.temp_file_path);
      formData.append('contract_type', contractType);
      if (Object.keys(columnMapping).length > 0) {
        formData.append('column_mapping', JSON.stringify(columnMapping));
      }

      const results = await uploadService.cleanAndValidate(formData);
      setValResults(results);
      setStep(3);
      fetchHistoryAndSamples();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Data validation encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> Confirm Import into PostgreSQL
  const handleConfirm = async () => {
    if (!valResults?.import_id) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await uploadService.confirmImport(valResults.import_id);
      setConfirmMessage(res.message);
      fetchHistoryAndSamples();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to commit records to database.');
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewMeta(null);
    setValResults(null);
    setConfirmMessage(null);
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Module 3</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-500">データアップロードセンター</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Data Upload & Ingestion Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-format data ingestion for CSV, XLSX, XLS, and JSON with schema detection, contract validation, and mathematical consistency checks.
          </p>
        </div>

        {step > 1 && (
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors self-start md:self-auto"
          >
            Start New Upload
          </button>
        )}
      </div>

      {/* Progress Steps Indicator */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto text-xs">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>1</span>
            <span>File Staging</span>
          </div>
          <div className="w-16 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>
            <span>Schema & Contract</span>
          </div>
          <div className="w-16 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>3</span>
            <span>Validation & Confirm</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* STEP 1: UPLOAD OR LOAD SAMPLE */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Upload Business Dataset</h3>
            <p className="text-xs text-slate-500 mb-6">
              Supported file formats: CSV, XLSX, XLS, JSON. Maximum payload: 50MB. All uploads are hashed and preserved.
            </p>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-colors">
              <UploadCloud className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 mb-1">
                Drag and drop your dataset here, or browse files
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Enterprise sales receipts, POS logs, ticket transactions or inventory sheets.
              </p>

              <input
                type="file"
                id="file-upload"
                accept=".csv, .xlsx, .xls, .json"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 cursor-pointer shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>{selectedFile ? selectedFile.name : 'Select File from Computer'}</span>
              </label>

              {selectedFile && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{selectedFile.name}</span>
                  <span className="text-slate-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handlePreview()}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Inspect Schema & Preview</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick Pre-Loaded Sample Datasets (for instant live verification) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Quick Test: Authorized Operational Datasets
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Click any verified dataset below to simulate operational ingestion with built-in validation edge cases (duplicate prevention & math formula checks).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {samples.map((s, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between hover:border-blue-300 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      {s.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {s.name.includes('sales')
                        ? 'Includes valid transactions + intentional math error & duplicate ID'
                        : 'Warehouse inventory with low-stock reorder thresholds'}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                      Size: {(s.size_bytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    onClick={() => handlePreview(s.path)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
                  >
                    <span>Load</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SCHEMA INSPECTION & TARGET CONTRACT SELECTION */}
      {step === 2 && previewMeta && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schema & Content Inspection</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  File: <strong className="text-slate-800">{previewMeta.file_name}</strong> | Total Rows: <strong className="font-mono text-blue-600">{previewMeta.total_rows}</strong> | Format: <span className="font-mono uppercase">{previewMeta.file_format}</span>
                </p>
              </div>

              {/* Target Contract Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Target Business Contract:</span>
                <select
                  value={contractType}
                  onChange={(e: any) => setContractType(e.target.value)}
                  className="text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="sales">Sales Transactions Contract (Formula Check: Qty × Unit Price = Total)</option>
                  <option value="inventory">Warehouse Inventory Contract (SKU, Stock & Reorder Levels)</option>
                </select>
              </div>
            </div>

            {/* Identified Columns Grid */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Identified Columns & Inferred Types:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {previewMeta.columns.map((col: ColumnInfo, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-mono font-bold text-slate-800 block truncate" title={col.name}>
                    {col.name}
                  </span>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span className="inline-block px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono text-[10px]">
                      {col.inferred_type}
                    </span>
                    <span>{col.null_count > 0 ? `${col.null_count} nulls` : '0 nulls'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview Rows Table */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Raw Data Preview (First 10 Rows):</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                  <tr>
                    {previewMeta.columns.map((c: ColumnInfo, i: number) => (
                      <th key={i} className="p-2.5 font-semibold">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewMeta.preview_rows.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {previewMeta.columns.map((c: ColumnInfo, cIdx: number) => (
                        <td key={cIdx} className="p-2.5 text-slate-700 truncate max-w-[160px]">
                          {String(row[c.name] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Step Action */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back to Staging
              </button>
              <button
                onClick={handleValidate}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Execute Cleaning & Contract Validation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATION SUMMARY & INSPECTION TABLES */}
      {step === 3 && valResults && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Records</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {valResults.summary.total_records}
              </div>
              <span className="text-[10px] text-slate-400">Parsed from file</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Valid Records
              </span>
              <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
                {valResults.summary.valid_records}
              </div>
              <span className="text-[10px] text-emerald-600">Passed all contract rules</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <span className="text-xs text-rose-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Invalid Records
              </span>
              <div className="text-2xl font-bold text-rose-700 font-mono mt-1">
                {valResults.summary.invalid_records}
              </div>
              <span className="text-[10px] text-rose-600">Held for audit review</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <span className="text-xs text-amber-700 font-medium">Duplicates Caught</span>
              <div className="text-2xl font-bold text-amber-700 font-mono mt-1">
                {valResults.summary.duplicate_records}
              </div>
              <span className="text-[10px] text-amber-600">Transaction ID collisions</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
              <span className="text-xs text-indigo-700 font-medium">Math Discrepancies</span>
              <div className="text-2xl font-bold text-indigo-700 font-mono mt-1">
                {valResults.summary.math_mismatches}
              </div>
              <span className="text-[10px] text-indigo-600">Qty × Price != Total</span>
            </div>
          </div>

          {/* Confirmation Banner */}
          {confirmMessage ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">Dataset Committed to PostgreSQL</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">{confirmMessage}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors shrink-0"
              >
                <span>View Real Metrics on Executive Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Review Before Storage</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm to commit the <strong className="text-emerald-700">{valResults.summary.valid_records} valid records</strong> directly into PostgreSQL. Invalid rows remain quarantined and traceable.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={valResults.report_url}
                  download
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Validation Report (CSV)</span>
                </a>
                <button
                  onClick={handleConfirm}
                  disabled={confirming || valResults.summary.valid_records === 0}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  {confirming ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>Confirm Import to PostgreSQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Inspection Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
              <button
                onClick={() => setActiveTab('valid')}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
                  activeTab === 'valid'
                    ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 border-x border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Valid Records ({valResults.summary.valid_records})
              </button>
              <button
                onClick={() => setActiveTab('invalid')}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
                  activeTab === 'invalid'
                    ? 'bg-white text-rose-600 border-t-2 border-t-rose-600 border-x border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Invalid Records with Errors ({valResults.summary.invalid_records})
              </button>
              <button
                onClick={() => setActiveTab('operations')}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
                  activeTab === 'operations'
                    ? 'bg-white text-slate-800 border-t-2 border-t-slate-800 border-x border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cleaning Operations Log ({valResults.cleaning_operations.length})
              </button>
            </div>

            <div className="p-4">
              {/* Tab 1: Valid Records Table */}
              {activeTab === 'valid' && (
                <div className="overflow-x-auto">
                  {valResults.valid_preview.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No records passed the contract validation rules.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="p-2">Row #</th>
                          <th className="p-2">Identifier</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Details</th>
                          <th className="p-2 text-right">Qty</th>
                          <th className="p-2 text-right">Price</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {valResults.valid_preview.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400">{r._row_number}</td>
                            <td className="p-2 font-semibold text-slate-900">{r.transaction_id || r.product_id}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                                {r.category}
                              </span>
                            </td>
                            <td className="p-2 text-slate-600 truncate max-w-[200px]">{r.product_name}</td>
                            <td className="p-2 text-right font-semibold">{r.quantity ?? r.available_quantity}</td>
                            <td className="p-2 text-right text-slate-600">¥{(r.unit_price ?? r.unit_cost ?? 0).toLocaleString()}</td>
                            <td className="p-2 text-right font-bold text-slate-900">
                              ¥{(r.total_amount ?? (r.available_quantity ? r.available_quantity * (r.unit_cost || 0) : 0)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 2: Invalid Records Table with Exact Issues & Math Fixes */}
              {activeTab === 'invalid' && (
                <div className="space-y-3">
                  {valResults.invalid_records.length === 0 ? (
                    <div className="p-8 text-center text-xs text-emerald-600 font-semibold">
                      Zero errors! All records in this file perfectly satisfied the contract requirements.
                    </div>
                  ) : (
                    valResults.invalid_records.map((r: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-rose-50/50 rounded-lg border border-rose-200 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-rose-900 flex items-center gap-1.5 font-mono">
                            <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-[10px]">
                              {r._row_number}
                            </span>
                            Row {r._row_number}: {r.transaction_id || r.product_id || 'Missing ID'}
                          </span>
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                            {r._issues.length} {r._issues.length === 1 ? 'Contract Violation' : 'Violations'}
                          </span>
                        </div>

                        {/* List of Issues */}
                        <div className="space-y-1.5 mt-2">
                          {r._issues.map((iss: any, iIdx: number) => (
                            <div key={iIdx} className="bg-white p-2.5 rounded border border-rose-200 text-[11px] text-slate-800">
                              <div className="flex items-start justify-between">
                                <span className="font-mono font-semibold text-rose-700">
                                  Field: [{iss.field_name}]
                                </span>
                                <span className="text-[10px] uppercase font-bold text-rose-600">
                                  {iss.severity}
                                </span>
                              </div>
                              <p className="mt-1 text-slate-700 font-medium">{iss.error_message}</p>
                              {iss.proposed_correction && (
                                <p className="mt-1 text-emerald-700 font-mono bg-emerald-50 p-1 rounded border border-emerald-200">
                                  Proposed Correction: Expected total value should be ¥{(Number(iss.proposed_correction) || 0).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Cleaning Operations Log */}
              {activeTab === 'operations' && (
                <div className="space-y-2">
                  {valResults.cleaning_operations.map((op: string, idx: number) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{op}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historical Ingestion Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          Ingestion & Validation History (PostgreSQL Data Imports)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Traceable audit log of every dataset uploaded, parsed, validated, and committed to database.
        </p>

        {history.length === 0 ? (
          <div className="text-center p-6 text-xs text-slate-400">
            No datasets uploaded yet. Staged datasets will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Import ID</th>
                  <th className="p-2.5">File Name</th>
                  <th className="p-2.5">Format</th>
                  <th className="p-2.5">Uploaded By</th>
                  <th className="p-2.5 text-right">Total Rows</th>
                  <th className="p-2.5 text-right">Valid</th>
                  <th className="p-2.5 text-right">Invalid</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h: any) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-400">#{h.id}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{h.file_name}</td>
                    <td className="p-2.5 uppercase">{h.file_format}</td>
                    <td className="p-2.5 text-slate-600">{h.uploaded_by}</td>
                    <td className="p-2.5 text-right font-semibold">{h.total_records}</td>
                    <td className="p-2.5 text-right text-emerald-600 font-semibold">{h.valid_records}</td>
                    <td className="p-2.5 text-right text-rose-600 font-semibold">{h.invalid_records}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          h.status === 'imported'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {h.has_report && (
                        <a
                          href={`/api/v1/uploads/${h.id}/report`}
                          download
                          className="text-blue-600 hover:underline flex items-center justify-end gap-1"
                        >
                          <Download className="w-3 h-3" /> Report
                        </a>
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
