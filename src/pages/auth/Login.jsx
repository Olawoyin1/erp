import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  selectAuthLoading,
  selectAuthError,
  selectMfaToken,
  selectIsAuthenticated,
  selectCurrentUser,
  clearError,
} from '../../store/authSlice';
import { peekAuthNotice, clearAuthNotice } from '../../services/apiClient';
import { usePermissions } from '../../hooks/usePermission';
import { canOpenPath, getLandingPath } from '../../components/layout/navConfig';
import AuthLayout, { AuthCard, AuthLogo, AuthInput, AuthButton } from './AuthLayout';
import { EyeToggle, FieldError } from './AuthParts';
import Toast, { useToast } from '../../components/ui/Toast';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();

  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const mfaToken = useSelector(selectMfaToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const [notice] = useState(() => peekAuthNotice());
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    clearAuthNotice();
    dispatch(clearError());
    if (notice) showToast(notice, 'info');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signed in: go back to where the user was heading if they may open it, else to their home page.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.mustChangePassword) {
      navigate('/auth/change-password', { replace: true });
      return;
    }
    const wanted = location.state?.from?.pathname;
    const usable = wanted && wanted !== '/' && !wanted.startsWith('/auth') && canOpenPath(wanted, can);
    navigate(usable ? `${wanted}${location.state.from.search || ''}` : getLandingPath(can), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (mfaToken) navigate('/auth/verify', { replace: true });
  }, [mfaToken, navigate]);

  // Show login errors as a toast instead of an inline banner
  useEffect(() => {
    if (error?.message) {
      showToast(error.message, 'error');
      dispatch(clearError());
    }
  }, [error, showToast, dispatch]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.id]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [e.target.id]: '' }));
    if (error) dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Work email is required';
    if (!form.password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    dispatch(loginUser({ email: form.email.trim(), password: form.password }));
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthLogo />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>Welcome back</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0' }}>Sign in to your PGSL ERP account.</p>

        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <AuthInput
              id="email"
              label="Work Email"
              required
              type="email"
              placeholder="name@pgsl.com"
              value={form.email}
              onChange={handleChange}
              style={fieldErrors.email ? { borderColor: '#DC2626' } : {}}
            />
            <FieldError>{fieldErrors.email}</FieldError>
          </div>

          <div>
            <AuthInput
              id="password"
              label="Password"
              required
              type={showPwd ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              rightIcon={<EyeToggle shown={showPwd} onToggle={() => setShowPwd(!showPwd)} />}
              style={fieldErrors.password ? { borderColor: '#DC2626' } : {}}
            />
            <FieldError>{fieldErrors.password}</FieldError>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span />
            <Link to="/auth/forgot-password" style={{ fontSize: '0.85rem', color: '#1D4ED8', textDecoration: 'none', fontWeight: 500 }}>
              Forgot Password?
            </Link>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
