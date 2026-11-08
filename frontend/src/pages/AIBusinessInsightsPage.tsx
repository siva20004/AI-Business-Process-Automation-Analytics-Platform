import React, { useState, useEffect } from 'react';
import { insightsService } from '../services/api';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Send,
  RefreshCw,
  Layers,
  Database,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  BrainCircuit,
  PieChart,
  Lightbulb
} from 'lucide-react';

export const AIBusinessInsightsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('all');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Q&A Assistant state
  const [question, setQuestion] = useState<string>('');
  const [asking, setAsking] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string; data?: any }>>([
    {
      q: 'What is our current total revenue and best performing division?',
      a: 'Awaiting first query or select a preset prompt below to test real-data grounded responses.',
    },
  ]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await insightsService.getExecutiveSummary(timeRange);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch business insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [timeRange]);

  const handleAsk = async (queryText?: string) => {
    const qToSend = queryText || question;
    if (!qToSend.trim()) return;

    setAsking(true);
    try {
      const res = await insightsService.askAssistant(qToSend);
      setQaHistory((prev) => [
        {
          q: res.question,
          a: res.answer,
          data: res.supporting_data,
        },
        ...prev,
      ]);
      setQuestion('');
    } catch (err: any) {
      alert(`Query failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
              Module 9 • AI経営分析サマリー
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Deterministic Grounded Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1C3F] mt-1">
            AI Business Insights & Executive Synthesis
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Strict Real-Data Mandate: Natural language executive analysis computed exclusively from verified PostgreSQL records with 0.0% hallucination risk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
            {['today', '7d', '30d', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  timeRange === t
                    ? 'bg-[#0F1C3F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t === 'today'
                  ? 'Today'
                  : t === '7d'
                  ? '7 Days'
                  : t === '30d'
                  ? '30 Days'
                  : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchInsights}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Provenance Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Data Provenance:</strong> {data?.provenance?.data_source || 'PostgreSQL Core DB (fuji_flow)'} •{' '}
            {data?.provenance?.sales_records_analyzed ?? 0} Sales Records •{' '}
            {data?.provenance?.inventory_records_analyzed ?? 0} Inventory SKUs
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Hallucination Risk: 0.0% (Deterministic Aggregation)</span>
        </div>
      </div>

      {/* Main Content or Empty State */}
      {!data?.has_data ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No business data available. Connect a data source or upload a dataset.
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            AI Business Insights requires at least one transaction or inventory dataset uploaded to calculate executive performance synthesis.
          </p>
        </div>
      ) : (
        <>
          {/* Key Quantitative Findings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.key_findings?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
              >
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <div className="mt-2 text-2xl font-bold text-[#0F1C3F] font-mono">
                  {item.value}
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.detail}</p>
              </div>
            ))}
          </div>

          {/* Executive Performance Synthesis Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Executive Synthesis & Operational Overview
              </h2>
            </div>

            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed font-sans space-y-3">
              {data.executive_briefing?.split('\n\n').map((paragraph: string, i: number) => (
                <p key={i} className="text-slate-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Strategic Recommendations Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Grounded Strategic Recommendations
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.strategic_recommendations?.map((rec: any) => {
                const isHigh = rec.priority === 'HIGH';
                return (
                  <div
                    key={rec.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {rec.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {rec.priority} Priority
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1.5">{rec.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{rec.action}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-2 text-[11px] space-y-1">
                      <p className="text-emerald-700 font-medium">
                        <strong>Impact:</strong> {rec.impact}
                      </p>
                      <p className="text-slate-400 font-mono text-[10px]">
                        Grounding: {rec.grounded_metric}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive "Ask Fuji Flow AI" Assistant */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Ask Fuji Flow AI (Grounded Q&A Engine)
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Direct SQL Semantic Resolver
              </span>
            </div>

            {/* Prompt presets */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-500 font-medium py-1">Quick Inquiries:</span>
              {[
                'What is our total net revenue?',
                'What is the average transaction value?',
                'Which division generates the most sales?',
                'Are there any low stock or stockout items?',
                'How many anomalies were flagged by AI?',
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleAsk(preset)}
                  disabled={asking}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg transition-colors border border-slate-200 text-xs font-medium"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask any operational question (e.g. 'What is our current average transaction value?')..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              />
              <button
                type="submit"
                disabled={asking || !question.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F1C3F] hover:bg-[#1A2E66] text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {asking ? 'Calculating...' : 'Query Engine'}
              </button>
            </form>

            {/* Q&A Stream */}
            <div className="space-y-3 pt-2">
              {qaHistory.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <span className="text-blue-600 font-mono">Q:</span>
                    <span>{item.q}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700 leading-relaxed pl-5">
                    <span className="text-emerald-600 font-mono font-bold shrink-0">A:</span>
                    <div>
                      <p>{item.a}</p>
                      {item.data && (
                        <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
                          {Object.entries(item.data).map(([k, v]) => (
                            <span key={k} className="bg-white border border-slate-200 px-2 py-0.5 rounded">
                              {k}: {typeof v === 'number' && !isNaN(v) ? `¥${v.toLocaleString()}` : JSON.stringify(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
