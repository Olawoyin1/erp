import { Link, useLocation } from 'react-router-dom';
import AuthLayout, { AuthCard, AuthLogo } from './AuthLayout';

export default function CheckEmail() {
  const email = useLocation().state?.email;
  return (
    <AuthLayout>
      <AuthCard>
        <AuthLogo />

        {/* Green checkmark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: '50%',
            border: '2px solid #16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0', textAlign: 'center' }}>Check your email</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px 0', textAlign: 'center', lineHeight: 1.7 }}>
          {email ? <>If an account exists for <strong>{email}</strong>, we have sent a password reset link.</> : 'If an account exists for that email, we have sent a password reset link.'}<br />
          Click the link in the email to create a new password. The link expires in 1 hour.
        </p>

        <div style={{
          padding: '12px 14px',
          backgroundColor: '#F8FAFC',
          borderRadius: 6,
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#64748B',
          marginBottom: 20,
          lineHeight: 1.6,
        }}>
          Didn't receive the email? Check your spam folder or return to{' '}
          <Link to="/auth/forgot-password" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 500 }}>
            Forgot Password
          </Link>{' '}
          to try again.
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/auth/login" style={{ fontSize: '0.85rem', color: '#475569', textDecoration: 'none', fontWeight: 500 }}>
            Back to Sign In
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
