import { Component, ErrorInfo, ReactNode } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  height?: number;
}

interface State {
  hasError: boolean;
}

export default class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Chart failed to render:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const h = this.props.height ?? 220;
      return (
        <div
          role="status"
          style={{ height: h }}
          className="flex flex-col items-center justify-center gap-3 text-center"
        >
          <div className="w-10 h-10 rounded-icon bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
            <BarChart3 size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
              This chart couldn't be displayed
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              The rest of the page is unaffected.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-button border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <RefreshCw size={12} />
            Retry chart
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
