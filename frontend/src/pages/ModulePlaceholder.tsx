import React from 'react';
import { Layers, CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModuleProps {
  moduleNumber: number;
  title: string;
  jpTitle: string;
  phase: number;
  description: string;
  dataContract: string[];
}

export const ModulePlaceholder: React.FC<ModuleProps> = ({
  moduleNumber,
  title,
  jpTitle,
  phase,
  description,
  dataContract,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Module {moduleNumber}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-medium text-slate-500">{jpTitle}</span>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Phase {phase} Roadmap
          </span>
        </div>

        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-600 mt-1 max-w-2xl">{description}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Strict Real-Data Ingestion Contract
        </h3>
        <p className="text-xs text-slate-500">
          In compliance with the project's zero-fabricated data rule, this module activates dynamically
          upon valid record ingestion from PostgreSQL or the Data Upload Center.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Required Schema Fields:
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-600 font-mono">
            {dataContract.map((field, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{field}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Phase {phase} functionality is locked until Phase 1 foundation approval.
          </span>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Return to Executive Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
