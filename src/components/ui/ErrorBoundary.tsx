import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches React reconciliation errors (e.g. insertBefore on
 * unmounted nodes) and shows a friendly in-place recovery UI instead of
 * blowing up the whole dashboard page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <div className="text-red-400 text-lg font-semibold">
            Une erreur est survenue lors de l'affichage.
          </div>
          <p className="text-slate-400 text-sm max-w-md">
            {this.state.error?.message || 'Erreur inconnue'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
