import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContextDef';
import { systemService } from '../services/api';
import { HealthResponse } from '../types';
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
  Mountain,
  LogOut,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';

interface NavItem {
  id: string;
  name: string;
  jpName: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'core' | 'data' | 'analytics' | 'automation' | 'admin';
}

const navItems: NavItem[] = [
  { id: 'dashboard', name: 'Executive Dashboard', jpName: '経営ダッシュボード', path: '/', icon: LayoutDashboard, category: 'core' },
  { id: 'sources', name: 'Data Sources', jpName: 'データソース連携', path: '/data-sources', icon: Database, category: 'data' },
  { id: 'upload', name: 'Data Upload Center', jpName: 'データアップロード', path: '/upload', icon: UploadCloud, category: 'data' },
  { id: 'validation', name: 'Data Cleaning & Validation', jpName: 'クレンジング・検証', path: '/validation', icon: CheckCircle2, category: 'data' },
  { id: 'workflows', name: 'Workflow Automation', jpName: 'ワークフロー自動化', path: '/workflows', icon: GitBranch, category: 'automation' },
  { id: 'sales', name: 'Sales Analytics', jpName: '売上・業績分析', path: '/sales', icon: TrendingUp, category: 'analytics' },
  { id: 'inventory', name: 'Inventory Analytics', jpName: '在庫・需給分析', path: '/inventory', icon: Boxes, category: 'analytics' },
  { id: 'anomalies', name: 'Anomaly Detection', jpName: 'AI異常検知エンジン', path: '/anomalies', icon: AlertTriangle, category: 'analytics' },
  { id: 'insights', name: 'AI Business Insights', jpName: 'AI経営分析サマリー', path: '/insights', icon: Sparkles, category: 'analytics' },
  { id: 'reports', name: 'Report Center', jpName: '自動レポート生成', path: '/reports', icon: FileSpreadsheet, category: 'admin' },
  { id: 'email', name: 'Email Automation', jpName: 'メール自動配信', path: '/email', icon: Mail, category: 'automation' },
  { id: 'history', name: 'Workflow History', jpName: '実行ログ・監視', path: '/workflow-history', icon: History, category: 'automation' },
  { id: 'users', name: 'User Management', jpName: 'アカウント管理', path: '/users', icon: Users, category: 'admin' },
  { id: 'settings', name: 'Settings', jpName: 'システム設定', path: '/settings', icon: Settings, category: 'admin' },
];

export const TopNavigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const fetchHealth = async () => {
    try {
      setChecking(true);
      const data = await systemService.getHealth();
      setHealth(data);
    } catch (e) {
      console.error('Health check failed', e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 350);
    }
  };

  // Scroll horizontal navigation with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
      checkScrollButtons();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full select-none shadow-md">
      {/* Tier 1: Classic Brand & Executive Control Header */}
      <div className="h-16 bg-[#0A132C] border-b border-[#1E293B] px-6 flex items-center justify-between text-white">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 flex items-center justify-center shadow-lg ring-1 ring-white/10">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-wider font-sans">
                  FUJI FLOW
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-sky-300 px-2 py-0.5 rounded border border-blue-400/30 font-mono">
                  DX 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-300/80 font-medium tracking-wide">
                Enterprise Process Automation & Analytics Platform
              </p>
            </div>
          </div>
        </div>

        {/* System Telemetry & User Controls */}
        <div className="flex items-center gap-4 text-xs">
          {/* Strict Real-Data Engine Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F1C3F] border border-blue-900/50 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">Pipeline:</span>
            <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE (Strict Real-Data)
            </span>
          </div>

          {/* Database Live Heartbeat */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F1C3F] border border-blue-900/50 text-slate-300">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400 font-medium">DB:</span>
            {health?.database ? (
              <span className="flex items-center gap-1.5 font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    health.database.healthy ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                />
                <span className="capitalize font-semibold text-slate-200">
                  {health.database.dialect || 'PostgreSQL'}
                </span>
                {health.database.latency_ms !== undefined && (
                  <span className="text-[10px] text-slate-400">
                    ({health.database.latency_ms}ms)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-slate-400">Connecting...</span>
            )}
            <button
              onClick={fetchHealth}
              title="Refresh database connectivity"
              className="text-slate-400 hover:text-sky-300 ml-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* User Account & Logout */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-100">
                    {user.full_name || user.email || 'Authorized User'}
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-blue-950/60 text-sky-300 border border-blue-700/40 font-mono">
                      <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-sky-400" />
                      {user.role || 'operator'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign Out of FUJI FLOW"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tier 2: Classic Horizontal Module Navigation Bar */}
      <div className="relative bg-white border-b border-slate-200">
        {/* Left Scroll Chevron Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 px-2 bg-gradient-to-r from-white via-white/95 to-transparent text-slate-600 hover:text-blue-600 flex items-center transition-opacity"
            title="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 bg-white rounded-full shadow-md border border-slate-200 p-0.5" />
          </button>
        )}

        {/* Scrollable Navigation Strip */}
        <nav
          ref={scrollRef}
          onScroll={checkScrollButtons}
          onWheel={handleWheel}
          className="flex items-center overflow-x-auto scrollbar-none px-4 py-1.5 gap-1.5 scroll-smooth"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/'}
                className={() =>
                  `shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs ring-1 ring-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  }`
                }
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-white' : 'text-blue-600'
                  }`}
                />
                <div className="flex flex-col text-left leading-tight">
                  <span className="whitespace-nowrap">{item.name}</span>
                  <span
                    className={`text-[9px] font-normal ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.jpName}
                  </span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Scroll Chevron Button */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-0 bottom-0 z-20 px-2 bg-gradient-to-l from-white via-white/95 to-transparent text-slate-600 hover:text-blue-600 flex items-center transition-opacity"
            title="Scroll right"
          >
            <ChevronRight className="w-5 h-5 bg-white rounded-full shadow-md border border-slate-200 p-0.5" />
          </button>
        )}
      </div>
    </header>
  );
};
