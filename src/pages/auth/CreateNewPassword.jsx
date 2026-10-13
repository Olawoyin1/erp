import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { apiError } from '../../services/apiHelpers';
import AuthLayout, { AuthCard, AuthLogo, AuthInput, AuthButton } from './AuthLayout';
import { AuthAlert, EyeToggle, FieldError } from './AuthParts';
import { PASSWORD_HINT, validateNewPassword, fieldErrorsFromResponse } from './passwordRules';

// Forgot-password and admin-triggered reset emails link to /reset-password?token=<token>.
export default function CreateNewPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show, setShow] = useState({ pwd: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.id]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.id]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateNewPassword(form.password, form.confirm);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.resetPassword(token, form.password);
      navigate('/auth/password-reset-success', { replace: true });
    } catch (err) {
      const fields = fieldErrorsFromResponse(err);
      if (fields.newPassword) setErrors({ password: fields.newPassword });
      else setServerError(apiError(err, 'Reset failed. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthLogo />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>This reset link is incomplete</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.6 }}>
            Open the link exactly as it appears in your email, or request a new one.
          </p>
          <Link to="/auth/forgot-password" style={{ fontSize: '0.85rem', color: '#1D4ED8', fontWeight: 500, textDecoration: 'none' }}>Request a new reset link</Link>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthLogo />
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>Create a new password</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Enter a new password for your PGSL ERP account.
        </p>

        <AuthAlert>{serverError}</AuthAlert>
        {serverError && /invalid|expired/i.test(serverError) && (
          <p style={{ margin: '-8px 0 16px', fontSize: '0.78rem' }}>
            <Link to="/auth/forgot-password" style={{ color: '#1D4ED8', fontWeight: 500, textDecoration: 'none' }}>Request a new reset link</Link>
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <AuthInput
              id="password"
              label="New Password"
              required
              type={show.pwd ? 'text' : 'password'}
              placeholder="Create your new password"
              value={form.password}
              onChange={handleChange}
              rightIcon={<EyeToggle shown={show.pwd} onToggle={() => setShow((p) => ({ ...p, pwd: !p.pwd }))} />}
              style={errors.password ? { borderColor: '#DC2626' } : {}}
            />
            <FieldError>{errors.password}</FieldError>
            {!errors.password && <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#94A3B8' }}>{PASSWORD_HINT}</p>}
          </div>

          <div>
            <AuthInput
              id="confirm"
              label="Confirm Password"
              required
              type={show.confirm ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={form.confirm}
              onChange={handleChange}
              rightIcon={<EyeToggle shown={show.confirm} onToggle={() => setShow((p) => ({ ...p, confirm: !p.confirm }))} />}
              style={errors.confirm ? { borderColor: '#DC2626' } : {}}
            />
            <FieldError>{errors.confirm}</FieldError>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </AuthButton>
        </form>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
          Need help? Contact your system administrator.
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
