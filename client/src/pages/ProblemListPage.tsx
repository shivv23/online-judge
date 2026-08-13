import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { problemsApi } from '../api/problems';
import Navbar from '../components/Navbar';
import type { Difficulty, Pagination, ProblemSummary } from '../types/problem';

const PAGE_SIZE = 20;

const DIFFICULTIES: Array<Difficulty | ''> = ['', 'Easy', 'Medium', 'Hard'];

function acceptanceRate(p: ProblemSummary): string {
  if (p.totalSubmissions === 0) {
    return 'N/A';
  }
  return `${((p.acceptedSubmissions / p.totalSubmissions) * 100).toFixed(1)}%`;
}

export default function ProblemListPage() {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, difficulty]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    problemsApi
      .list({
        page,
        limit: PAGE_SIZE,
        difficulty: difficulty || undefined,
        search: debouncedSearch || undefined,
      })
      .then((result) => {
        if (!cancelled) {
          setProblems(result.problems);
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
  }, [page, debouncedSearch, difficulty]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container">
        <h2>Problems</h2>

        <div className="problem-toolbar">
          <input
            className="problem-search"
            type="search"
            placeholder="Search by title or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="difficulty-filter">
            {DIFFICULTIES.map((d) => (
              <button
                key={d || 'all'}
                className={`btn btn-sm ${difficulty === d ? 'btn-primary' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d === '' ? 'All' : d}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="muted">Loading problems…</p>
        ) : problems.length === 0 ? (
          <p className="muted">No problems found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Tags</th>
                  <th>Submissions</th>
                  <th>Acceptance</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link className="problem-title" to={`/problems/${p.slug}`}>
                        {p.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                    </td>
                    <td>
                      <span className="tag-list">
                        {p.tags.slice(0, 3).map((t) => (
                          <span key={t} className="tag">
                            {t}
                          </span>
                        ))}
                        {p.tags.length > 3 && <span className="muted">+{p.tags.length - 3}</span>}
                      </span>
                    </td>
                    <td>{p.totalSubmissions}</td>
                    <td>{acceptanceRate(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
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
