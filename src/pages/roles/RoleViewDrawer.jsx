import { useCallback, useState } from 'react';
import { FiEdit2, FiShield } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import { roleService } from '../../services/platform.service';
import AuditTrail from '../users/AuditTrail';
import { formatDateTime } from '../users/auditFormat';
import { PermissionMatrix, PermissionKeyList } from './PermissionEditor';
import { deriveGrid } from './permissionPresets';

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

export default function RoleViewDrawer({ role, catalogue, onClose, onEdit, canEdit, canAudit }) {
  const [tab, setTab] = useState('details');
  const roleId = role?._id;
  const fetchPage = useCallback((params) => roleService.getAuditLog(roleId, params), [roleId]);
  if (!role) return null;

  const { grid } = deriveGrid(catalogue, role.permissions);
  const isAll = role.slug === 'super-admin';

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiShield size={20} color="#1D4ED8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{role.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400 }}>
              {role.roleCode} · {role.department}
              {role.isSystem && <span style={{ marginLeft: 6, color: '#EA580C', fontSize: '0.7rem', fontWeight: 600 }}>SYSTEM</span>}
            </div>
          </div>
        </div>
      }
      width="540px"
    >
      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={onEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            <FiEdit2 size={13} /> Edit Role
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <button style={tabStyle(tab === 'details')} onClick={() => setTab('details')}>Details</button>
        <button style={tabStyle(tab === 'permissions')} onClick={() => setTab('permissions')}>Permissions</button>
        {canAudit && <button style={tabStyle(tab === 'audit')} onClick={() => setTab('audit')}>Audit Trail</button>}
      </div>

      {tab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            {[
              ['Role ID', role.roleCode],
              ['Role Name', role.name],
              ['Department', role.department],
              ['Users Assigned', role.userCount ?? '—'],
              ['Created', formatDateTime(role.createdAt)],
              ['Last Updated', formatDateTime(role.updatedAt)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8' }}>{label}</span>
                <span style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8', marginBottom: 6 }}>Description</div>
            <div style={{ fontSize: '0.875rem', color: '#0F172A', fontStyle: 'italic' }}>{role.description || '—'}</div>
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isAll && (
            <div style={{ padding: '10px 14px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: '0.82rem', color: '#1E40AF' }}>
              Super Admin passes every permission check, whatever is listed below.
            </div>
          )}
          <PermissionMatrix grid={grid} onChange={() => {}} readOnly />
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', marginBottom: 8 }}>
              All permission keys ({role.permissions?.length || 0})
            </div>
            <PermissionKeyList permissions={role.permissions} />
          </div>
        </div>
      )}

      {tab === 'audit' && canAudit && <AuditTrail fetchPage={fetchPage} />}
    </Drawer>
  );
}
