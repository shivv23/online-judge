import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand navbar-brand">
        Online Judge
      </Link>
      <div className="navbar-links">
        <Link to="/problems">Problems</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/submissions">Submissions</Link>
            <Link to="/profile" className="navbar-user" title={user.email}>
              {user.username}
            </Link>
            <button className="btn btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register" className="btn btn-sm btn-primary">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
