import { useNavigate } from 'react-router-dom';
import AuthLayout, { AuthCard, AuthLogo, AuthButton } from './AuthLayout';

export default function PasswordResetSuccess() {
  const navigate = useNavigate();

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

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0', textAlign: 'center' }}>
          Password reset successful
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 28px 0', textAlign: 'center', lineHeight: 1.7 }}>
          Your password has been updated. You can now sign in with your new password.
        </p>

        <AuthButton onClick={() => navigate('/auth/login')}>
          Sign In
        </AuthButton>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
          You can sign in using your work email and new password.
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
