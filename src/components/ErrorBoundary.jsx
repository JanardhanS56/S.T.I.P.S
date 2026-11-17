import { Component } from 'react';
import { Link } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Button } from './ui/Button.jsx';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    try {
      Sentry.captureException(error, { extra: errorInfo });
    } catch {
      // ignore sentry dispatch failure
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px' }}>
          <div className="card stack" style={{ padding: '40px 32px' }}>
            <span className="mono small warn">ERROR 500</span>
            <h1 style={{ margin: '8px 0 16px', fontSize: '32px' }}>Something went wrong</h1>
            <p className="muted" style={{ lineHeight: 1.6, margin: '0 0 24px' }}>
              A problem prevented this screen from displaying properly. You can refresh the page to
              try again, or head back to the home screen.
            </p>
            <div className="row" style={{ gap: '12px' }}>
              <Button variant="dark" onClick={this.handleReload}>
                Refresh page
              </Button>
              <Link to="/" className="btn" onClick={() => this.setState({ hasError: false })}>
                Return home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
