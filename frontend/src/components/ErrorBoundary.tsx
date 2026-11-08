import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Mountain } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FUJI FLOW Uncaught Runtime Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0F1C3F] flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-lg w-full bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[#0A132C] p-6 text-center text-white border-b border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <h2 className="text-lg font-bold">FUJI FLOW UI Recovery</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enterprise DX Platform</p>
            </div>

            {/* Error Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                <p className="font-bold text-xs">A runtime exception occurred in the application view:</p>
                <pre className="mt-1.5 font-mono text-[11px] bg-rose-100/50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                  {this.state.error?.message || 'Unknown component rendering error'}
                </pre>
              </div>

              <p className="text-slate-600 leading-relaxed">
                This is typically caused by a stale browser token or corrupted cache. Click below to reset your local session state and return to the secure login console.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={this.handleReset}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0F1C3F] hover:bg-[#1A2E66] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Clear Session & Return to Login
                </button>
                <button
                  onClick={this.handleReload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
