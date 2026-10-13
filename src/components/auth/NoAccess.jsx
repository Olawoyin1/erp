import { useNavigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import { usePermissions } from '../../hooks/usePermission';
import { getLandingPath } from '../layout/navConfig';

/** Shown inside the layout when the user opens a page their roles do not allow. */
export default function NoAccess() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const landing = getLandingPath(can);

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
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FiLock size={24} />
      </div>
      <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#0F172A' }}>You do not have access to this page</h1>
      <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
        Your role does not include permission to open this section. If you think this is a mistake, ask an
        administrator to review your role.
      </p>
      <button
        onClick={() => navigate(landing)}
        style={{ marginTop: 8, padding: '9px 20px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
      >
        Go to my home page
      </button>
    </div>
  );
}
