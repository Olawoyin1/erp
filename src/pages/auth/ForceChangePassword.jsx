import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { authService } from '../../services/auth.service';
import { apiError } from '../../services/apiHelpers';
import { endSession } from '../../services/apiClient';
import { logoutUser } from '../../store/authSlice';
import AuthLayout, { AuthCard, AuthLogo, AuthInput, AuthButton } from './AuthLayout';
import { AuthAlert, EyeToggle, FieldError } from './AuthParts';
import { PASSWORD_HINT, validateNewPassword, fieldErrorsFromResponse } from './passwordRules';

/**
 * Shown to an account created with a temporary password (`mustChangePassword`). Changing the password
 * ends every session of the account (server rule), so the user signs in again with the new one.
 */
export default function ForceChangePassword() {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ current: '', password: '', confirm: '' });
  const [show, setShow] = useState({ current: false, pwd: false, confirm: false });
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
    if (!form.current) errs.current = 'Enter your current password';
    if (!errs.password && form.password === form.current) errs.password = 'Choose a password different from the current one';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.changePassword(form.current, form.password);
      endSession('Your password was changed. Please sign in with your new password.');
    } catch (err) {
      const fields = fieldErrorsFromResponse(err);
      if (fields.currentPassword || fields.newPassword) {
        setErrors({ current: fields.currentPassword, password: fields.newPassword });
      } else {
        setServerError(apiError(err, 'Could not change the password. Check your connection and try again.'));
      }
      setLoading(false);
    }
  };

  const toggle = (key) => () => setShow((p) => ({ ...p, [key]: !p[key] }));

  return (
    <AuthLayout>
      <AuthCard>
        <AuthLogo />
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>Choose a new password</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Your account uses a temporary password. Set your own before you continue.
        </p>

        <AuthAlert>{serverError}</AuthAlert>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <AuthInput
              id="current"
              label="Current Password"
              required
              type={show.current ? 'text' : 'password'}
              value={form.current}
              onChange={handleChange}
              rightIcon={<EyeToggle shown={show.current} onToggle={toggle('current')} />}
              style={errors.current ? { borderColor: '#DC2626' } : {}}
            />
            <FieldError>{errors.current}</FieldError>
          </div>
          <div>
            <AuthInput
              id="password"
              label="New Password"
              required
              type={show.pwd ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              rightIcon={<EyeToggle shown={show.pwd} onToggle={toggle('pwd')} />}
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
              value={form.confirm}
              onChange={handleChange}
              rightIcon={<EyeToggle shown={show.confirm} onToggle={toggle('confirm')} />}
              style={errors.confirm ? { borderColor: '#DC2626' } : {}}
            />
            <FieldError>{errors.confirm}</FieldError>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Change Password'}
          </AuthButton>
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => dispatch(logoutUser())}
              style={{ background: 'none', border: 'none', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}
            >
              Sign out
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
