import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout, { AuthCard, AuthLogo, AuthInput, AuthButton } from './AuthLayout';

export default function SetupPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show, setShow] = useState({ pwd: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.id]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.confirm) e.confirm = 'Please confirm your password';
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/auth/setup-complete');
    }, 900);
  };

  const EyeIcon = ({ field }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      onClick={() => setShow((p) => ({ ...p, [field]: !p[field] }))}
      style={{ cursor: 'pointer' }}
    >
      {show[field] ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      )}
    </svg>
  );

  return (
    <AuthLayout>
      <AuthCard>
        <AuthLogo />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>Welcome to PGSL ERP</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Your account has been created. Set up your password to get started.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pre-filled email read-only */}
          <AuthInput
            id="email-display"
            label="Work Email"
            required
            value="amaka@pgsl.com"
            readOnly
          />

          <div>
            <AuthInput
              id="password"
              label="Create Password"
              required
              type={show.pwd ? 'text' : 'password'}
              placeholder="Create your password"
              value={form.password}
              onChange={handleChange}
              rightIcon={<EyeIcon field="pwd" />}
              style={errors.password ? { borderColor: '#DC2626' } : {}}
            />
            {errors.password && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#DC2626' }}>{errors.password}</p>}
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
              rightIcon={<EyeIcon field="confirm" />}
              style={errors.confirm ? { borderColor: '#DC2626' } : {}}
            />
            {errors.confirm && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#DC2626' }}>{errors.confirm}</p>}
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Setting up…' : 'Set Up Account'}
          </AuthButton>
        </form>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
          Need help? Contact your system administrator.
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
