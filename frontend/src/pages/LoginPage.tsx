import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContextDef';
import { Mountain, Lock, Mail, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@fujikyuko.co.jp');
  const [password, setPassword] = useState('FujiFlow2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('FujiFlow2026!');
  };

  return (
    <div className="min-h-screen w-full bg-[#0F1C3F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background grid and ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        {/* Header Banner */}
        <div className="bg-[#0A132C] p-8 text-center text-white relative">
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 flex items-center justify-center shadow-lg mb-3">
            <Mountain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">FUJI FLOW</h2>
          <p className="text-xs text-blue-200/80 font-medium tracking-wide mt-1">
            Enterprise DX Platform
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-[11px] text-blue-300">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>Enterprise Process Automation & Analytics</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@fujikyuko.co.jp"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to FUJI FLOW</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Select Buttons for Authorized Demo Users */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Authorized Test Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@fujikyuko.co.jp')}
                className="p-2 text-left rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <div className="font-semibold text-xs text-slate-800">Admin Account</div>
                <div className="text-[10px] text-slate-500">admin@fujikyuko.co.jp</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('analyst@fujikyuko.co.jp')}
                className="p-2 text-left rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <div className="font-semibold text-xs text-slate-800">Analyst Account</div>
                <div className="text-[10px] text-slate-500">analyst@fujikyuko.co.jp</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-500">
            Enterprise Process Automation & Analytics Platform. Strict Real-Data Security Policy Enforced.
          </p>
        </div>
      </div>
    </div>
  );
};
