import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { submissionsApi } from '../api/submissions';
import Navbar from '../components/Navbar';
import VerdictBadge from '../components/VerdictBadge';
import { useAuth } from '../context/AuthContext';
import type { Pagination } from '../types/problem';
import type { Submission } from '../types/submission';

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');

    submissionsApi
      .listUser(user.id, { page, limit: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) {
          setSubmissions(result.submissions);
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
  }, [user, page]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container">
        <h2>My Submissions</h2>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="muted">Loading submissions…</p>
        ) : submissions.length === 0 ? (
          <p className="muted">
            You haven't submitted anything yet.{' '}
            <Link to="/problems">Browse problems</Link> to get started.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Verdict</th>
                  <th>Problem</th>
                  <th>Language</th>
                  <th>Tests</th>
                  <th>Time</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <VerdictBadge verdict={s.verdict} />
                    </td>
                    <td>
                      {s.problem ? (
                        <Link className="problem-title" to={`/problems/${s.problem.slug}`}>
                          {s.problem.title}
                        </Link>
                      ) : (
                        <span className="muted">Unknown</span>
                      )}
                    </td>
                    <td>{s.language}</td>
                    <td>
                      {s.testCasesPassed}/{s.totalTestCases}
                    </td>
                    <td>{s.executionTimeMs != null ? `${s.executionTimeMs} ms` : '—'}</td>
                    <td className="muted">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
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
