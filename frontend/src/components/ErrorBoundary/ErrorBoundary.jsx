import { Component } from "react";
import PropTypes from "prop-types";
import "./ErrorBoundary.css";

// Keeps a render crash from leaving a blank screen.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("App crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="error-boundary">
        <div className="eb-card">
          <span>🍽️</span>
          <h1>Kuch gadbad ho gayi</h1>
          <p>App ko thoda rest chahiye. Page reload karke dobara try karein.</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
