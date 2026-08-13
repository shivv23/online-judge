import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 className="brand">Online Judge</h1>
        <p className="muted">Practice, compete, and improve your programming skills.</p>
        {user ? (
          <div className="auth-actions">
            <Link className="btn btn-primary btn-block" to="/dashboard">
              Go to Dashboard
            </Link>
            <Link className="btn btn-block" to="/problems">
              Browse Problems
            </Link>
          </div>
        ) : (
          <div className="auth-actions">
            <Link className="btn btn-primary btn-block" to="/register">
              Create an Account
            </Link>
            <Link className="btn btn-block" to="/login">
              Sign In
            </Link>
            <Link className="btn btn-block" to="/problems">
              Browse Problems
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
