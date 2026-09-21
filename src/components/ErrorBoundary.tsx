import { Component, type ReactNode } from 'react';

/** Last-resort catch: never show a blank page — show what happened instead. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[DropX] Uncaught render error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="font-display text-5xl font-black text-ember">Oops</p>
          <h1 className="mt-2 font-display text-xl font-extrabold">Something broke on this page</h1>
          <p className="mt-2 break-words rounded-2xl bg-white p-4 text-left font-mono text-xs text-ink/70 shadow-card ring-1 ring-ink/5">
            {this.state.error.message}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-paper"
            >
              Reload page
            </button>
            <a href="/" className="rounded-full border border-ink/15 bg-white px-6 py-2.5 text-sm font-bold">
              Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
