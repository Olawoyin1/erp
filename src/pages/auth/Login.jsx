import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout, { AuthCard, AuthLogo, AuthInput, AuthButton } from './AuthLayout';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.id]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Work email is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    // Simulate auth → go to MFA
    setTimeout(() => {
      setLoading(false);
      navigate('/auth/verify');
    }, 900);
  };

  const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" onClick={() => setShowPwd(!showPwd)} style={{ cursor: 'pointer' }}>
      {showPwd ? (
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>Welcome back</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0' }}>Sign in to your PGSL ERP account.</p>

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
              style={errors.email ? { borderColor: '#DC2626' } : {}}
            />
            {errors.email && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#DC2626' }}>{errors.email}</p>}
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
              rightIcon={<EyeIcon />}
              style={errors.password ? { borderColor: '#DC2626' } : {}}
            />
            {errors.password && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#DC2626' }}>{errors.password}</p>}
          </div>

          {/* Remember me + Forgot password */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#1D4ED8', cursor: 'pointer', width: 15, height: 15 }}
              />
              Remember me
            </label>
            <Link to="/auth/forgot-password" style={{ fontSize: '0.85rem', color: '#1D4ED8', textDecoration: 'none', fontWeight: 500 }}>
              Forgot Password?
            </Link>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
