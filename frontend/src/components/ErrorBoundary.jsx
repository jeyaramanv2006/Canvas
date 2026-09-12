import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-3xl bg-murugan-card border border-red-500/30 text-center space-y-4 shadow-xl max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Something went wrong in this section</h3>
            <p className="text-xs text-red-300/80 mt-1">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-murugan-accent hover:bg-yellow-400 text-black font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
