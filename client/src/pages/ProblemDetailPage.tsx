import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Link, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { problemsApi } from '../api/problems';
import { submissionsApi, waitForVerdict } from '../api/submissions';
import Navbar from '../components/Navbar';
import { verdictClass } from '../components/VerdictBadge';
import { useAuth } from '../context/AuthContext';
import type { ProblemDetail } from '../types/problem';
import type { Language, Submission } from '../types/submission';

const LANGUAGES: Array<{ id: Language; label: string }> = [
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'js', label: 'JavaScript' },
];

const MONACO_LANGUAGE: Record<Language, string> = {
  cpp: 'cpp',
  c: 'c',
  python: 'python',
  java: 'java',
  js: 'javascript',
};

const STARTER_CODE: Record<Language, string> = {
  python: `import sys

def main():
    data = sys.stdin.read().split()
    # TODO: solve the problem

if __name__ == "__main__":
    main()
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // TODO: solve the problem
    return 0;
}
`,
  c: `#include <stdio.h>

int main() {
    // TODO: solve the problem
    return 0;
}
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        // TODO: solve the problem
    }
}
`,
  js: `const readline = require('readline');
// TODO: solve the problem
`,
};

function acceptanceRate(p: ProblemDetail): string {
  if (p.totalSubmissions === 0) {
    return 'N/A';
  }
  return `${((p.acceptedSubmissions / p.totalSubmissions) * 100).toFixed(1)}%`;
}

export default function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState(STARTER_CODE.python);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setNotFound(false);

    problemsApi
      .get(slug ?? '')
      .then((p) => {
        if (!cancelled) {
          setProblem(p);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
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
  }, [slug]);

  function selectLanguage(l: Language) {
    setLanguage(l);
    setCode(STARTER_CODE[l]);
  }

  async function handleSubmit() {
    if (!user || !problem || submitting) {
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    setSubmission(null);

    const active = true;
    try {
      const created = await submissionsApi.create({ problemId: problem.id, language, code });
      const final = await waitForVerdict(created.id, (s) => {
        if (active) {
          setSubmission(s);
        }
      });
      if (active) {
        setSubmission(final);
      }
    } catch (err) {
      if (active) {
        setSubmitError(getApiErrorMessage(err));
      }
    } finally {
      if (active) {
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container container-wide">
        <Link to="/problems" className="muted">
          ← Back to problems
        </Link>

        {loading && <p className="muted">Loading problem…</p>}
        {notFound && (
          <>
            <h2>Problem not found</h2>
            <p className="muted">The problem you are looking for does not exist.</p>
          </>
        )}
        {error && <div className="error-banner">{error}</div>}

        {problem && (
          <div className="problem-layout">
            <section className="problem-statement">
              <div className="problem-meta">
                <h2>{problem.title}</h2>
                <span className={`badge badge-${problem.difficulty.toLowerCase()}`}>
                  {problem.difficulty}
                </span>
              </div>
              <div className="tag-list">
                {problem.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
              <p className="muted">
                Time limit: {problem.timeLimit} ms · Memory limit: {problem.memoryLimit} MB ·
                Acceptance: {acceptanceRate(problem)}
              </p>

              <h3>Problem</h3>
              <div className="statement">{problem.statement}</div>

              <h3>Input</h3>
              <div className="statement">{problem.inputFormat}</div>

              <h3>Output</h3>
              <div className="statement">{problem.outputFormat}</div>

              <h3>Constraints</h3>
              <div className="statement">{problem.constraints}</div>

              <h3>Examples</h3>
              <div className="sample-grid">
                <div>
                  <div className="sample-label">Sample Input</div>
                  <pre className="sample-block">{problem.sampleInput}</pre>
                </div>
                <div>
                  <div className="sample-label">Sample Output</div>
                  <pre className="sample-block">{problem.sampleOutput}</pre>
                </div>
              </div>
            </section>

            <section className="editor-panel">
              {user ? (
                <>
                  <div className="editor-toolbar">
                    <div className="language-select">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.id}
                          className={`btn btn-sm ${language === l.id ? 'btn-primary' : ''}`}
                          onClick={() => selectLanguage(l.id)}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? 'Judging…' : 'Submit'}
                    </button>
                  </div>

                  <div className="monaco-wrap">
                    <Editor
                      height="420px"
                      language={MONACO_LANGUAGE[language]}
                      value={code}
                      onChange={(value) => setCode(value ?? '')}
                      theme="vs-dark"
                      options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>

                  {submitError && <div className="error-banner">{submitError}</div>}

                  {submission && (
                    <div className={`verdict-banner ${verdictClass(submission.verdict)}`}>
                      <strong>{submission.verdict}</strong>
                      {submission.verdict !== 'Compile Error' && (
                        <span>
                          {' '}
                          · {submission.testCasesPassed}/{submission.totalTestCases} test cases
                          passed
                          {submission.executionTimeMs != null &&
                            ` · ${submission.executionTimeMs} ms`}
                        </span>
                      )}
                      {(submission.verdict === 'Compile Error' ||
                        submission.verdict === 'Runtime Error') &&
                        submission.errorMessage && (
                          <pre className="verdict-error-output">{submission.errorMessage}</pre>
                        )}
                    </div>
                  )}
                </>
              ) : (
                <div className="card">
                  <h3>Sign in to submit</h3>
                  <p className="muted">
                    You must be signed in to submit a solution for this problem.
                  </p>
                  <div className="auth-actions">
                    <Link className="btn btn-primary btn-block" to="/login">
                      Sign in
                    </Link>
                    <Link className="btn btn-block" to="/register">
                      Create an account
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
