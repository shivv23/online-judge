import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { usersApi } from '../api/users';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import type { MyStats } from '../types/leaderboard';

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MyStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    usersApi
      .myStats()
      .then((s) => {
        if (!cancelled) {
          setStats(s);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container">
        <h2>{user?.username}</h2>
        <p className="muted">
          {user?.fullName} · {user?.email}
        </p>

        {error && <div className="error-banner">{error}</div>}

        {stats && (
          <>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.solvedProblems}</div>
                <div className="stat-label">Problems solved</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.rank}</div>
                <div className="stat-label">Leaderboard rank</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.acceptedSubmissions}</div>
                <div className="stat-label">Accepted submissions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalSubmissions}</div>
                <div className="stat-label">Total submissions</div>
              </div>
            </div>

            <h3>Verdict breakdown</h3>
            <div className="verdict-list">
              {Object.entries(stats.verdicts).map(([verdict, count]) => (
                <span key={verdict} className="tag">
                  {verdict}: {count}
                </span>
              ))}
              {Object.keys(stats.verdicts).length === 0 && (
                <p className="muted">No submissions yet.</p>
              )}
            </div>
          </>
        )}

        {!stats && !error && <p className="muted">Loading stats…</p>}

        <div className="auth-actions" style={{ marginTop: '2rem', maxWidth: 320 }}>
          <Link className="btn btn-block" to="/submissions">
            View my submissions
          </Link>
        </div>
      </main>
    </div>
  );
}
