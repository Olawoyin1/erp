import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout, { AuthCard, AuthLogo, AuthButton } from './AuthLayout';

const OTP_LENGTH = 6;

export default function VerifyIdentity() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refs = useRef([]);

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setError('');
    if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
    setOtp(next);
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = () => {
    setTimer(45);
    setCanResend(false);
    setOtp(Array(OTP_LENGTH).fill(''));
    refs.current[0]?.focus();
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Please enter the 6-digit code'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <AuthLayout>
      <AuthCard>
        <AuthLogo />

        {/* Shield icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0', textAlign: 'center' }}>Verify your identity</h1>
        <p style={{ fontSize: '0.83rem', color: '#64748B', margin: '0 0 24px 0', textAlign: 'center', lineHeight: 1.6 }}>
          Enter the 6-digit verification code sent to <strong>amaka@pgsl.com</strong>
        </p>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 12 }}>
              Verification Code
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }} onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (refs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{
                    width: 46, height: 52,
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    border: `1.5px solid ${error ? '#DC2626' : digit ? '#1D4ED8' : '#E2E8F0'}`,
                    borderRadius: 8,
                    outline: 'none',
                    color: '#0F172A',
                    backgroundColor: digit ? '#EFF6FF' : '#FFFFFF',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1D4ED8'; }}
                  onBlur={(e) => { if (!digit) e.target.style.borderColor = '#E2E8F0'; }}
                />
              ))}
            </div>
            {error && <p style={{ marginTop: 8, textAlign: 'center', fontSize: '0.75rem', color: '#DC2626' }}>{error}</p>}
            <p style={{ marginTop: 10, textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
              Code expires in 10 minutes
            </p>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify'}
          </AuthButton>

          {/* Resend */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#F8FAFC',
            borderRadius: 6,
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#64748B',
          }}>
            Didn't receive an code?{' '}
            {canResend ? (
              <button onClick={handleResend} type="button" style={{ background: 'none', border: 'none', color: '#1D4ED8', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
                Resend
              </button>
            ) : (
              <span><strong style={{ color: '#1D4ED8' }}>Resend</strong> in {fmt(timer)}</span>
            )}
          </div>

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
