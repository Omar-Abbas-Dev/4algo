import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full p-8 rounded-2xl border border-rose-800/40
            bg-rose-950/20 text-white space-y-4">
            <h1 className="text-2xl font-black text-rose-400">NavX Arena — Render Error</h1>
            <p className="text-sm text-slate-400">
              A JavaScript error occurred. Check the browser console (F12) for the full trace.
            </p>
            <pre className="text-xs font-mono text-rose-300 bg-black/40 p-4 rounded-xl
              overflow-auto max-h-60 border border-rose-900/40">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-sm transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
