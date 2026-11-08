import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/authContextDef';
import { systemService } from '../services/api';
import { HealthResponse } from '../types';
import { Database, LogOut, ShieldCheck, UserCircle, RefreshCw } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState<boolean>(false);

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
      {/* Title & Corporate Scope */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            FUJI FLOW
            <span className="text-xs font-normal text-slate-500">| Enterprise Process Automation & Analytics Platform</span>
          </h1>
        </div>
      </div>

      {/* Right controls: Database Health, User profile & Logout */}
      <div className="flex items-center gap-4">
        {/* PostgreSQL Live Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-600 font-medium">DB:</span>
          {health?.database ? (
            <span className="flex items-center gap-1.5 font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  health.database.healthy ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="capitalize font-semibold text-slate-700">
                {health.database.dialect || 'PostgreSQL'}
              </span>
              {health.database.latency_ms !== undefined && (
                <span className="text-[11px] text-slate-400">
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
            className="text-slate-400 hover:text-blue-600 ml-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* User Role & Name */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 font-bold text-xs">
                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">
                  {user.full_name || user.email || 'Authorized User'}
                </span>
                <div className="flex items-center gap-1 justify-end">
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-blue-600" />
                    {user.role || 'operator'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
