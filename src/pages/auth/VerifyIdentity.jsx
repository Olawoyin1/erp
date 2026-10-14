import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  verifyOtp,
  selectAuthLoading,
  selectAuthError,
  selectMfaToken,
  selectCurrentUser,
  selectMfaEmail,
  selectIsAuthenticated,
  clearError,
  clearMfa,
} from '../../store/authSlice';
import { authService } from '../../services/auth.service';
import { usePermissions } from '../../hooks/usePermission';
import { getLandingPath } from '../../components/layout/navConfig';
import AuthLayout, { AuthCard, AuthLogo, AuthButton } from './AuthLayout';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 45; // seconds — backend enforces 45s minimum

export default function VerifyIdentity() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectAuthLoading);
  const serverError = useSelector(selectAuthError);
  const mfaToken = useSelector(selectMfaToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const mfaEmail = useSelector(selectMfaEmail);
  const { can } = usePermissions();

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_COOLDOWN);
  const canResend = timer <= 0;
  const [localError, setLocalError] = useState('');
  const [resending, setResending] = useState(false);
  const refs = useRef([]);

  // If no mfaToken in store (e.g. landed here directly), send back to login
  useEffect(() => {
    if (!mfaToken && !isAuthenticated) navigate('/auth/login', { replace: true });
  }, [mfaToken, isAuthenticated, navigate]);

  // Once verified, go to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.mustChangePassword ? '/auth/change-password' : getLandingPath(can), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Clear previous errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return undefined;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setLocalError('');
    if (serverError) dispatch(clearError());
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

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    try {
      await authService.resendOtp(mfaToken);
      setTimer(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      setLocalError('');
      dispatch(clearError());
      refs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Could not resend code. Try again.';
      setLocalError(msg);
    } finally {
      setResending(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setLocalError('Please enter the 6-digit code'); return; }
    dispatch(verifyOtp({ mfaToken, code }));
  };

  const handleBack = () => {
    dispatch(clearMfa());
    dispatch(clearError());
    navigate('/auth/login');
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const displayError = localError || serverError?.message;

  return (
    <AuthLayout>
      <AuthCard>
        <AuthLogo />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0', textAlign: 'center' }}>Verify your identity</h1>
        <p style={{ fontSize: '0.83rem', color: '#64748B', margin: '0 0 24px 0', textAlign: 'center', lineHeight: 1.6 }}>
          Enter the 6-digit verification code sent to{' '}
          <strong>{mfaEmail ?? 'your email'}</strong>
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
                    border: `1.5px solid ${displayError ? '#DC2626' : digit ? '#1D4ED8' : '#E2E8F0'}`,
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
            {displayError && (
              <p style={{ marginTop: 8, textAlign: 'center', fontSize: '0.75rem', color: '#DC2626' }}>{displayError}</p>
            )}
            <p style={{ marginTop: 10, textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
              Code expires in 10 minutes
            </p>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify'}
          </AuthButton>

          <div style={{
            padding: '10px 14px',
            backgroundColor: '#F8FAFC',
            borderRadius: 6,
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#64748B',
          }}>
            Didn't receive a code?{' '}
            {canResend ? (
              <button
                onClick={handleResend}
                type="button"
                disabled={resending}
                style={{ background: 'none', border: 'none', color: '#1D4ED8', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
              >
                {resending ? 'Sending…' : 'Resend'}
              </button>
            ) : (
              <span><strong style={{ color: '#1D4ED8' }}>Resend</strong> in {fmt(timer)}</span>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleBack}
              style={{ background: 'none', border: 'none', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
