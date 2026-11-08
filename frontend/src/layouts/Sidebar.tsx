import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  UploadCloud,
  CheckCircle2,
  GitBranch,
  TrendingUp,
  Boxes,
  AlertTriangle,
  Sparkles,
  FileSpreadsheet,
  Mail,
  History,
  Users,
  Settings,
  Mountain
} from 'lucide-react';

interface NavItem {
  name: string;
  jpName: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Executive Dashboard', jpName: '経営ダッシュボード', path: '/', icon: LayoutDashboard },
  { name: 'Data Sources', jpName: 'データソース連携', path: '/data-sources', icon: Database },
  { name: 'Data Upload Center', jpName: 'データアップロード', path: '/upload', icon: UploadCloud },
  { name: 'Data Cleaning & Validation', jpName: 'クレンジング・検証', path: '/validation', icon: CheckCircle2 },
  { name: 'Workflow Automation', jpName: 'ワークフロー自動化', path: '/workflows', icon: GitBranch },
  { name: 'Sales Analytics', jpName: '売上・業績分析', path: '/sales', icon: TrendingUp },
  { name: 'Inventory Analytics', jpName: '在庫・需給分析', path: '/inventory', icon: Boxes },
  { name: 'Anomaly Detection', jpName: 'AI異常検知エンジン', path: '/anomalies', icon: AlertTriangle },
  { name: 'AI Business Insights', jpName: 'AI経営分析サマリー', path: '/insights', icon: Sparkles },
  { name: 'Report Center', jpName: '自動レポート生成', path: '/reports', icon: FileSpreadsheet },
  { name: 'Email Automation', jpName: 'メール自動配信', path: '/email', icon: Mail },
  { name: 'Workflow History', jpName: '実行ログ・監視', path: '/workflow-history', icon: History },
  { name: 'User Management', jpName: 'アカウント管理', path: '/users', icon: Users },
  { name: 'Settings', jpName: 'システム設定', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-72 bg-[#0F1C3F] text-slate-300 flex flex-col shrink-0 border-r border-[#1E293B] shadow-xl select-none">
      {/* Brand Header */}
      <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800 bg-[#0A132C]">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-700 to-sky-500 flex items-center justify-center shadow-md">
          <Mountain className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white tracking-wider">FUJI FLOW</span>
            <span className="text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">DX 2.0</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Enterprise DX Platform</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Enterprise Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <div className="flex flex-col text-left">
                  <span>{item.name}</span>
                  <span className="text-[10px] opacity-70 font-normal">{item.jpName}</span>
                </div>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-blue-400/20 text-blue-200 px-1.5 py-0.5 rounded font-mono">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Enterprise Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#0A132C]/80">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="font-medium">Node Environment</span>
          <span className="font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE
          </span>
        </div>
        <p className="text-[10px] text-slate-500">
          Strict Real-Data Pipeline v1.0.0
        </p>
      </div>
    </aside>
  );
};
