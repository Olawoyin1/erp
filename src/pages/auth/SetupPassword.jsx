import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { apiError } from '../../services/apiHelpers';
import AuthLayout, { AuthCard, AuthLogo, AuthInput, AuthButton } from './AuthLayout';
import { AuthAlert, EyeToggle, FieldError } from './AuthParts';
import { PASSWORD_HINT, validateNewPassword, fieldErrorsFromResponse } from './passwordRules';

// The invitation email links to /accept-invite?token=<token> (the token is the only parameter).
// The token is exchanged with POST /auth/reset-password, which also activates the invited account.
export default function SetupPassword() {
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
      navigate('/auth/setup-complete', { replace: true });
    } catch (err) {
      const fields = fieldErrorsFromResponse(err);
      if (fields.newPassword) setErrors({ password: fields.newPassword });
      else setServerError(apiError(err, 'Setup failed. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthLogo />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>This invitation link is incomplete</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.6 }}>
            Open the link exactly as it appears in your invitation email. If it still does not work, ask your administrator to resend the invitation.
          </p>
          <Link to="/auth/login" style={{ fontSize: '0.85rem', color: '#1D4ED8', fontWeight: 500, textDecoration: 'none' }}>Go to Sign In</Link>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthLogo />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>Welcome to PGSL ERP</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Your account has been created. Set up your password to get started.
        </p>

        <AuthAlert>{serverError}</AuthAlert>
        {serverError && /invalid|expired/i.test(serverError) && (
          <p style={{ margin: '-8px 0 16px', fontSize: '0.78rem', color: '#64748B' }}>
            Invitations expire after 7 days. Ask your administrator to resend yours.
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <AuthInput
              id="password"
              label="Create Password"
              required
              type={show.pwd ? 'text' : 'password'}
              placeholder="Create your password"
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
            {loading ? 'Setting up...' : 'Set Up Account'}
          </AuthButton>
        </form>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
          Need help? Contact your system administrator.
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
