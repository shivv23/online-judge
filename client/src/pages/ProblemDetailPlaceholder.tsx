import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ProblemDetailPlaceholder() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container">
        <Link to="/problems" className="muted">
          ← Back to problems
        </Link>
        <h2>{slug}</h2>
        <p className="muted">
          Full problem statement, sample cases, and the code editor are coming in the next step.
        </p>
      </main>
    </div>
  );
}
