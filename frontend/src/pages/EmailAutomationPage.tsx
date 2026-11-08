import React, { useState, useEffect } from 'react';
import { emailService, reportService } from '../services/api';
import {
  Mail,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Paperclip,
  Clock,
  ShieldCheck,
  X,
  Layers,
  Inbox
} from 'lucide-react';

export const EmailAutomationPage: React.FC = () => {
  const [config, setConfig] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  // Form State
  const [templateType, setTemplateType] = useState<string>('daily_briefing');
  const [recipientsInput, setRecipientsInput] = useState<string>('management@fujikyuko.co.jp, board@fujikyuko.co.jp');
  const [customNote, setCustomNote] = useState<string>('Q1 Digital Transformation board review summary.');
  const [selectedReportId, setSelectedReportId] = useState<string>('');

  // Preview Modal
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cfg, hist, reps] = await Promise.all([
        emailService.getConfig(),
        emailService.getHistory(),
        reportService.getReports(20),
      ]);
      setConfig(cfg);
      setHistory(hist);
      setReports(reps);
    } catch (e) {
      console.error('Failed to load email service data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRecipientList = () => {
    return recipientsInput
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
  };

  const handlePreview = async () => {
    const list = getRecipientList();
    if (list.length === 0) {
      alert('Please enter at least one recipient email address.');
      return;
    }
    setPreviewLoading(true);
    try {
      const preview = await emailService.previewEmail({
        template_type: templateType,
        recipients: list,
        custom_note: customNote,
        report_id: selectedReportId ? parseInt(selectedReportId) : undefined,
      });
      setPreviewData(preview);
    } catch (err: any) {
      alert(`Preview failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    const list = getRecipientList();
    if (list.length === 0) return;

    if (!confirm(`Are you sure you want to dispatch this email to ${list.length} recipients?\n\nStrict Policy: Dispatches are permanent and logged to the audit trail.`)) {
      return;
    }

    setSending(true);
    try {
      const result = await emailService.sendEmail({
        template_type: templateType,
        recipients: list,
        custom_note: customNote,
        report_id: selectedReportId ? parseInt(selectedReportId) : undefined,
      });
      alert(`Email dispatched successfully!\nStatus: ${result.status}\nMode: ${result.delivery_mode}`);
      setPreviewData(null);
      await fetchData();
    } catch (err: any) {
      alert(`Dispatch failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
              Module 11 • メール自動配信
            </span>
            <span className="text-xs text-slate-400 font-mono">SMTP & Explicit User Confirmation</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1C3F] mt-1">
            Automated Email Dispatch & Alerting
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Strict Real-Data Mandate: Delivers executive briefings and inventory warnings with attached PDF/Excel reports with zero synthetic data.
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
        </div>
      </div>

      {/* SMTP Telemetry Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">SMTP Gateway:</span>
              <span className="font-mono text-slate-700">{config?.smtp_server}:{config?.smtp_port}</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                TLS Active
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Sender: <strong>{config?.sender_email}</strong> ({config?.sender_name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Explicit User Confirmation Enforced Before Dispatch
        </div>
      </div>

      {/* Two Column Layout: Composer & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Email Composer */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Notification Dispatch Composer</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Notification Template
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="daily_briefing">Executive Daily Performance Digest</option>
                <option value="inventory_alert">Supply Chain Low-Stock Emergency Alert</option>
                <option value="anomaly_audit">AI Anomaly & Outlier Audit Notification</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Recipients (Comma separated)
              </label>
              <input
                type="text"
                value={recipientsInput}
                onChange={(e) => setRecipientsInput(e.target.value)}
                placeholder="controller@fujikyuko.co.jp, board@fujikyuko.co.jp"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Custom Directive / Management Note
              </label>
              <textarea
                rows={3}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Add special instructions or executive commentary..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Attach Compiled Corporate Report (Optional)
              </label>
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">No attachment (HTML Summary Only)</option>
                {reports.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.title} ({rep.file_format.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              {previewLoading ? 'Rendering...' : 'Preview Email'}
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F1C3F] hover:bg-[#1A2E66] text-white font-bold rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              {sending ? 'Dispatching...' : 'Confirm & Dispatch'}
            </button>
          </div>
        </div>

        {/* Right: Dispatch Audit Trail */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Email Delivery Audit Register</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {history.length} Dispatched
              </span>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-2">
                  <Inbox className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-700">No dispatch history recorded</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Send your first briefing from the composer to register delivery telemetry.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Recipients</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Delivery Mode</th>
                      <th className="py-2.5 px-3">Dispatched At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/75">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate" title={h.subject}>
                          {h.subject}
                          {h.attachment_name && (
                            <span className="block text-[10px] font-mono text-blue-600 flex items-center gap-1 mt-0.5">
                              <Paperclip className="w-3 h-3" />
                              {h.attachment_name}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {h.recipients?.join(', ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3" />
                            {h.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {h.delivery_mode}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                          {h.dispatched_at
                            ? new Date(h.dispatched_at).toLocaleTimeString('ja-JP', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Email Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                  Rendered Email Preview
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Subject: {previewData.subject}
                </h3>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100/50 border-b border-slate-200 text-xs text-slate-600 space-y-1">
              <p><strong>From:</strong> {previewData.sender}</p>
              <p><strong>To:</strong> {previewData.recipients?.join(', ')}</p>
              {previewData.attachment_name && (
                <p className="flex items-center gap-1 text-blue-700">
                  <Paperclip className="w-3.5 h-3.5" />
                  <strong>Attachment:</strong> {previewData.attachment_name}
                </p>
              )}
            </div>

            <div
              className="p-6 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewData.body_html }}
            />

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Close Preview
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm"
              >
                {sending ? 'Dispatching...' : 'Confirm & Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
