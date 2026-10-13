import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectBootstrapping,
  selectBootstrapError,
  selectCurrentUser,
  fetchCurrentUser,
  retryBootstrap,
  logoutUser,
} from '../../store/authSlice';

const centered = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 14,
  fontFamily: 'var(--font)',
  color: '#475569',
  padding: 24,
  textAlign: 'center',
};

/**
 * Wraps the protected routes: waits for the session check, sends a signed-out visitor to the login
 * page, offers a retry when the server cannot be reached (the session is kept), and sends a user who
 * must change their temporary password to that screen first.
 */
export default function RequireAuth({ children }) {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const bootstrapping = useSelector(selectBootstrapping);
  const bootstrapError = useSelector(selectBootstrapError);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div style={centered} role="status" aria-live="polite">
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '3px solid #E2E8F0',
            borderTopColor: '#1D4ED8',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.85rem' }}>Loading your workspace...</span>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div style={centered}>
        <h1 style={{ fontSize: '1.2rem', color: '#0F172A', margin: 0 }}>We could not load your account</h1>
        <p style={{ margin: 0, maxWidth: 420, fontSize: '0.88rem' }}>{bootstrapError}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 18px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => {
              dispatch(retryBootstrap());
              dispatch(fetchCurrentUser());
            }}
          >
            Try again
          </button>
          <button
            style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
            onClick={() => dispatch(logoutUser())}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (user?.mustChangePassword && location.pathname !== '/auth/change-password') {
    return <Navigate to="/auth/change-password" replace />;
  }

  return children;
}
