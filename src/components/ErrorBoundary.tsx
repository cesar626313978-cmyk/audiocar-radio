import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AudioCar Radio ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleResetAndReload = (): void => {
    try {
      localStorage.clear();
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message ||
        (typeof this.state.error === 'string' ? this.state.error : 'Error desconocido de ejecución en la interfaz');

      return (
        <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans select-none">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-red-500/40 shadow-2xl shadow-red-950/40 p-6 sm:p-8 space-y-5">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  Error de Renderizado Detectado
                </h1>
                <p className="text-xs text-slate-400">
                  AudioCar Radio • Protección de Cabina
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2 overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                Detalle del Error:
              </p>
              <pre className="text-xs sm:text-sm font-mono text-slate-200 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {errorMessage}
              </pre>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[11px] font-mono text-slate-500 whitespace-pre-wrap break-words max-h-28 overflow-y-auto pt-2 border-t border-slate-800/80">
                  {this.state.errorInfo.componentStack.trim()}
                </pre>
              )}
            </div>

            <button
              onClick={this.handleResetAndReload}
              className="w-full min-h-[54px] px-5 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm sm:text-base shadow-lg shadow-red-950/50 flex items-center justify-center space-x-2.5 active:scale-[0.99] transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 shrink-0" />
              <span>Restablecer datos locales y recargar</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
