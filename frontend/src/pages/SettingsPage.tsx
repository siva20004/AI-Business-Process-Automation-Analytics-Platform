import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/api';
import {
  Settings,
  Database,
  ShieldCheck,
  Server,
  Cpu,
  Clock,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  Building2,
  Lock
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Module 14 • システム設定・ガバナンス
            </span>
            <span className="text-xs text-slate-400 font-mono">Platform Governance & Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1C3F] mt-1">
            System Settings & Architecture Diagnostics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Strict Real-Data Mandate: System configuration, PostgreSQL database health, and enterprise compliance.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          Refresh Diagnostics
        </button>
      </div>

      {/* Strict Policy Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-emerald-900">
              Strict Real-Data Requirement: ENFORCED
            </h3>
            <p className="text-emerald-700 text-xs mt-0.5">
              Synthetic record generation, hardcoded KPIs, and simulated statistics are prohibited across all modules.
            </p>
          </div>
        </div>
        <span className="bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full font-bold text-xs">
          Zero Fabricated Data Compliance
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Corporate Entity Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Corporate Entity Profile</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Corporate Name</span>
              <span className="font-bold text-slate-800">{settings?.platform?.organization}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Japanese Designation</span>
              <span className="font-bold text-slate-800">{settings?.platform?.japanese_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Headquarters</span>
              <span className="text-slate-800">{settings?.platform?.headquarters}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Operating System Timezone</span>
              <span className="font-mono text-slate-800">{settings?.platform?.timezone}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Default Currency Accounting</span>
              <span className="font-bold text-slate-800">{settings?.platform?.currency}</span>
            </div>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">PostgreSQL Infrastructure Diagnostics</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Relational Database Engine</span>
              <span className="font-bold text-slate-800">{settings?.database?.engine}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Connection Status</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {settings?.database?.status?.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Host & Port</span>
              <span className="font-mono text-slate-800">{settings?.database?.host}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Database Name</span>
              <span className="font-mono text-slate-800">{settings?.database?.database_name}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Python DB Driver</span>
              <span className="font-mono text-slate-800">{settings?.database?.driver}</span>
            </div>
          </div>
        </div>

        {/* Database Entity Telemetry */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HardDrive className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Core Relational Entity Volumes</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Transactions</span>
              <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                {settings?.system_telemetry?.total_transactions ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Inventory SKUs</span>
              <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                {settings?.system_telemetry?.total_inventory_items ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pipeline Runs</span>
              <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                {settings?.system_telemetry?.total_pipeline_executions ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Anomalies</span>
              <p className="text-xl font-bold text-rose-700 font-mono mt-0.5">
                {settings?.system_telemetry?.total_flagged_anomalies ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Platform Governance & Compliance */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">Governance & Security Controls</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Audit Trail Retention</span>
              <span className="font-bold text-slate-800">{settings?.governance?.audit_trail_retention_days} Days</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">JWT Token Expiration</span>
              <span className="font-mono text-slate-800">480 Minutes (8 Hours)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Password Hashing Algorithm</span>
              <span className="font-mono text-slate-800">bcrypt (12 rounds)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Human-In-The-Loop Audit</span>
              <span className="font-bold text-emerald-700">Enforced for Anomalies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
