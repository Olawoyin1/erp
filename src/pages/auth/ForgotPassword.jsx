import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout, { AuthCard, AuthLogo, AuthInput, AuthButton } from './AuthLayout';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) { setError('Work email is required'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/auth/check-email');
    }, 900);
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthLogo />
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>Forgot your password?</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Enter your work email and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <AuthInput
              id="email"
              label="Work Email"
              required
              type="email"
              placeholder="amaka@pgsl.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              style={error ? { borderColor: '#DC2626' } : {}}
            />
            {error && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#DC2626' }}>{error}</p>}
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </AuthButton>

          <div style={{ textAlign: 'center' }}>
            <Link to="/auth/login" style={{ fontSize: '0.85rem', color: '#475569', textDecoration: 'none', fontWeight: 500 }}>
              Back to Sign In
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
