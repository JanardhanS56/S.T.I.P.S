import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page" style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px' }}>
      <div className="card stack" style={{ padding: '40px 32px' }}>
        <span className="mono small green">ERROR 404</span>
        <h1 style={{ margin: '8px 0 16px', fontSize: '32px' }}>Page not found</h1>
        <p className="muted" style={{ lineHeight: 1.6, margin: '0 0 24px' }}>
          The page you are looking for doesn’t exist or might have moved. Check the address or head
          back to home.
        </p>
        <div>
          <Link to="/" className="btn btn-dark">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
