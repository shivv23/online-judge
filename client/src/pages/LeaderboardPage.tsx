import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/client';
import { usersApi } from '../api/users';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import type { LeaderboardEntry } from '../types/leaderboard';
import type { Pagination } from '../types/problem';

const PAGE_SIZE = 20;

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    usersApi
      .leaderboard({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) {
          setEntries(result.entries);
          setPagination(result.pagination);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container">
        <h2>Leaderboard</h2>
        <p className="muted">
          Ranked by number of distinct problems solved with an accepted solution.
        </p>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="muted">Loading leaderboard…</p>
        ) : entries.length === 0 ? (
          <p className="muted">No solvers yet. Be the first to submit an accepted solution!</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Solved</th>
                  <th>Accepted submissions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const isYou = user != null && e.userId === user.id;
                  return (
                    <tr key={e.userId} className={isYou ? 'rank-you' : undefined}>
                      <td className="rank-cell">{e.rank}</td>
                      <td>
                        {e.username}
                        {isYou && <span className="you-tag">you</span>}
                      </td>
                      <td>{e.solved}</td>
                      <td>{e.totalAccepted}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <span className="muted">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
