import { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiUser } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import { userService } from '../../services/platform.service';
import AuditTrail from './AuditTrail';
import { auditReason, formatDateTime } from './auditFormat';
import StatusPill from './StatusPill';

const detailItem = (label, value) => (
  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8' }}>{label}</span>
    <span style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500, wordBreak: 'break-word' }}>{value || '—'}</span>
  </div>
);

const tabStyle = (active) => ({
  padding: '10px 0',
  fontSize: '0.875rem',
  fontWeight: active ? 700 : 500,
  color: active ? '#1D4ED8' : '#64748B',
  border: 'none',
  borderBottom: active ? '2px solid #1D4ED8' : '2px solid transparent',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  marginBottom: -1,
});

/**
 * Read-only user card with the audit trail tab. `menuItems` is the same action list as the row menu
 * ([{ label, icon, action, color }]); `canEdit` and `canAudit` come from the viewer's permissions.
 */
export default function UserViewDrawer({ user, onClose, onEdit, menuItems, canEdit, canAudit }) {
  const [tab, setTab] = useState('details');
  const [reasonFor, setReasonFor] = useState({ key: '', value: null });

  const userId = user?._id;
  const status = user?.status;
  const reasonKey = `${userId}:${status}`;
  const statusReason = reasonFor.key === reasonKey ? reasonFor.value : null;

  const fetchPage = useCallback((params) => userService.getAuditLog(userId, params), [userId]);

  // Why the account is suspended or deactivated lives only in the audit trail.
  useEffect(() => {
    if (!canAudit || !userId || !['suspended', 'deactivated'].includes(status)) return undefined;
    let cancelled = false;
    userService
      .getAuditLog(userId, { page: 1, limit: 20 })
      .then((res) => {
        const entry = res.data.data.find((e) => e.action === `user.status.${status}`);
        if (!cancelled) setReasonFor({ key: reasonKey, value: auditReason(entry) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [canAudit, userId, status, reasonKey]);

  if (!user) return null;

  const roleNames = (user.roles || []).map((r) => r?.name || r).join(', ');

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiUser size={16} color="#1D4ED8" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400 }}>{user.userCode} · {user.email}</div>
          </div>
        </div>
      }
      width="520px"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
          <StatusPill status={status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {canEdit && (
            <button onClick={onEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiEdit2 size={13} /> Edit User
            </button>
          )}
          {menuItems.length > 0 && <RowMenu items={menuItems} />}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <button style={tabStyle(tab === 'details')} onClick={() => setTab('details')}>Details</button>
        {canAudit && <button style={tabStyle(tab === 'audit')} onClick={() => setTab('audit')}>Audit Trail</button>}
      </div>

      {tab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
          {detailItem('User ID', user.userCode)}
          {detailItem('First Name', user.firstName)}
          {detailItem('Last Name', user.lastName)}
          {detailItem('Work Email', user.email)}
          {detailItem('Department', user.departmentId?.name)}
          {detailItem('Role', roleNames)}
          {detailItem('Job Title', user.jobTitle)}
          {detailItem('Location', user.locationId?.name)}
          {detailItem('Phone Number', user.phoneNumber)}
          {detailItem('Joined', formatDateTime(user.createdAt))}
          {detailItem('Last Active', user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never signed in')}
          {detailItem('Status', status ? status.charAt(0).toUpperCase() + status.slice(1) : '')}
          {statusReason && detailItem(status === 'suspended' ? 'Suspension Reason' : 'Deactivation Reason', statusReason)}
        </div>
      )}

      {tab === 'audit' && canAudit && <AuditTrail fetchPage={fetchPage} />}
    </Drawer>
  );
}
