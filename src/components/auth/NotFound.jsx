import { useNavigate } from 'react-router-dom';
import { FiCompass } from 'react-icons/fi';
import { usePermissions } from '../../hooks/usePermission';
import { getLandingPath } from '../layout/navConfig';

export default function NotFound() {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 12,
        padding: '72px 16px',
        fontFamily: 'var(--font)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#EFF6FF',
          color: '#1D4ED8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FiCompass size={24} />
      </div>
      <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#0F172A' }}>Page not found</h1>
      <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
        The page you are looking for does not exist or has moved.
      </p>
      <button
        onClick={() => navigate(getLandingPath(can))}
        style={{ marginTop: 8, padding: '9px 20px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
      >
        Go to my home page
      </button>
    </div>
  );
}
