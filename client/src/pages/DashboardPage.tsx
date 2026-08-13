import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container">
        <h2>Welcome back, {user?.fullName}!</h2>
        <p className="muted">
          Signed in as <strong>{user?.email}</strong>
        </p>

        <div className="card-grid">
          <div className="card">
            <h3>Problems</h3>
            <p className="muted">Browse the problem set and start solving.</p>
            <Link className="btn btn-sm" to="/problems">
              Browse
            </Link>
          </div>
          <div className="card">
            <h3>Submissions</h3>
            <p className="muted">Review your past submissions and verdicts.</p>
            <Link className="btn btn-sm" to="/submissions">
              Coming soon
            </Link>
          </div>
          <div className="card">
            <h3>Leaderboard</h3>
            <p className="muted">See how you rank against other solvers.</p>
            <Link className="btn btn-sm" to="/leaderboard">
              Coming soon
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
