import React, { useState, useRef, useEffect } from 'react';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Drawer from '../../components/ui/Drawer';
import Toast, { useToast } from '../../components/ui/Toast';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiMoreVertical,
  FiEdit2,
  FiEye,
  FiMail,
  FiKey,
  FiUserX,
  FiUserCheck,
  FiX,
  FiUser,
} from 'react-icons/fi';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  'Human Resources', 'Finance & Accounts', 'Procurement', 'Administration',
  'Technical', 'HSE', 'Quality System', 'Business Development', 'System',
];
const ROLES = [
  'Super Admin', 'MD/CEO', 'Admin — HOD', 'Admin — Staff', 'HR — HOD', 'HR — Staff',
  'Finance — Line Manager', 'Finance — HOD', 'Finance — Manager/CFO', 'Finance — Staff',
  'Technical Director', 'Technical — Staff', 'HSE — HOD', 'HSE — Staff',
  'Quality — HOD', 'Quality — Staff', 'Procurement — HOD', 'Procurement — Staff',
  'BizDev — HOD', 'BizDev — Staff', 'Employee', 'HOD',
];

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockUsers = [
  { id: 'USR-001', firstName: 'Grace', lastName: 'Mensah', email: 'grace.mensah@pgsl.com', department: 'Human Resources', role: 'HOD', lastActive: '28/05/25 9:12 AM', status: 'Active', phone: '0803 456 7890', joined: '12/08/26' },
  { id: 'USR-002', firstName: 'Ibrahim', lastName: 'Musa', email: 'ibrahim.musa@pgsl.com', department: 'Technical', role: 'Employee', lastActive: '-', status: 'Invited', phone: '0802 111 2222', joined: '01/09/26' },
  { id: 'USR-003', firstName: 'Emmanuel', lastName: 'Eze', email: 'emmanuel.eze@pgsl.com', department: 'Administration', role: 'HOD', lastActive: '28/05/25 9:12 AM', status: 'Active', phone: '0801 333 4444', joined: '15/01/26' },
  { id: 'USR-004', firstName: 'Zainab', lastName: 'Mohammed', email: 'zainab.mohammed@pgsl.com', department: 'Finance & Accounts', role: 'Employee', lastActive: '28/05/25 9:12 AM', status: 'Active', phone: '0809 555 6666', joined: '03/03/26' },
  { id: 'USR-005', firstName: 'Adeola', lastName: 'Olatunji', email: 'adeola.olatunji@pgsl.com', department: 'Quality System', role: 'Employee', lastActive: '-', status: 'Invited', phone: '0806 777 8888', joined: '20/05/26' },
  { id: 'USR-006', firstName: 'Tunde', lastName: 'Bakare', email: 'tunde.bakare@pgsl.com', department: 'HSE', role: 'HOD', lastActive: '-', status: 'Invited', phone: '0805 999 0000', joined: '11/02/26' },
  { id: 'USR-007', firstName: 'Amaka', lastName: 'Ugochukwu', email: 'amaka.ugochukwu@pgsl.com', department: 'Business Development', role: 'Employee', lastActive: '28/05/25 9:12 AM', status: 'Active', phone: '0804 123 4567', joined: '07/04/26' },
  { id: 'USR-008', firstName: 'Damilola', lastName: 'Adebayo', email: 'damiloa.adebayo@pgsl.com', department: 'System', role: 'Admin', lastActive: '28/05/25 9:12 AM', status: 'Active', phone: '0803 234 5678', joined: '01/01/26' },
  { id: 'USR-009', firstName: 'Chidera', lastName: 'Nwosu', email: 'chidera.nwosu@pgsl.com', department: 'Quality System', role: 'HOD', lastActive: '28/05/25 9:12 AM', status: 'Suspended', phone: '0807 345 6789', joined: '14/06/26' },
  { id: 'USR-010', firstName: 'Ijeoma', lastName: 'Chukwuma', email: 'ijeoma.chukwuma@pgsl.com', department: 'Technical', role: 'Employee', lastActive: '28/05/25 9:12 AM', status: 'Deactivated', phone: '0808 456 7890', joined: '22/07/26' },
];

const AUDIT_LOGS = [
  { date: '27 Aug 2026, 3:45 PM', action: 'Account Created', by: 'Super Admin' },
  { date: '27 Aug 2026, 3:45 PM', action: 'Account Activated', by: 'System' },
  { date: '27 Aug 2026, 3:45 PM', action: 'Role Changed', by: 'Super Admin' },
  { date: '27 Aug 2026, 3:45 PM', action: 'Login', by: 'System' },
];

const ITEMS_PER_PAGE = 10;

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Active:      { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  Invited:     { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA' },
  Suspended:   { bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A' },
  Deactivated: { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
};
function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Deactivated;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RowMenu({ user, onView, onEdit, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const activeMenuItems = [
    { label: 'Edit User',       icon: <FiEdit2 size={13} />,     action: () => onEdit(),               color: '#334155' },
    { label: 'Reset Password',  icon: <FiKey size={13} />,       action: () => onAction('resetPwd'),   color: '#334155' },
    { label: 'Suspend User',    icon: <FiUserX size={13} />,     action: () => onAction('suspend'),    color: '#DC2626' },
    { label: 'Deactivate User', icon: <FiUserX size={13} />,     action: () => onAction('deactivate'), color: '#DC2626' },
  ];
  const invitedMenuItems = [
    { label: 'Edit User',    icon: <FiEdit2 size={13} />, action: () => onEdit(),                 color: '#334155' },
    { label: 'Resend Invite',icon: <FiMail size={13} />,  action: () => onAction('resend'),       color: '#334155' },
    { label: 'Cancel Invite',icon: <FiX size={13} />,    action: () => onAction('cancelInvite'), color: '#DC2626' },
  ];
  const suspendedMenuItems = [
    { label: 'Edit User',       icon: <FiEdit2 size={13} />,     action: () => onEdit(),               color: '#334155' },
    { label: 'Reactivate User', icon: <FiUserCheck size={13} />, action: () => onAction('reactivate'), color: '#16A34A' },
  ];

  const items = user.status === 'Invited' ? invitedMenuItems
    : user.status === 'Suspended' ? suspendedMenuItems
    : activeMenuItems;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 100, width: 185, minWidth: 'max-content' }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { item.action(); setOpen(false); }}
              style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add / Edit User Drawer ───────────────────────────────────────────────────
function UserFormDrawer({ isOpen, onClose, onSave, user }) {
  const isEditing = !!user;
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', department: 'Human Resources', role: 'Employee', phone: '' });

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, department: user.department, role: user.role, phone: user.phone || '' });
    else setForm({ firstName: '', lastName: '', email: '', department: 'Human Resources', role: 'Employee', phone: '' });
  }, [user, isOpen]);

  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: value })); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  const footer = (
    <>
      <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
      <button type="submit" form="user-form" style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
        {isEditing ? 'Save Changes' : 'Send Invite'}
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User' : 'Add User'}
      subtitle={isEditing ? 'Update user account details.' : 'Create a user account and assign their department and role.'}
      width="520px"
      footer={footer}
    >
      <form id="user-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="User ID" required>
            <Input value={user?.id || 'USR-001'} readOnly style={{ backgroundColor: '#F8FAFC', color: '#94A3B8' }} />
          </FormField>
          <FormField label="First Name" required>
            <Input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Aminat" required />
          </FormField>
          <FormField label="Last Name" required>
            <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Yusuf" required />
          </FormField>
          <FormField label="Work Email" required>
            <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="amina.yusuf@pgsl.com" required />
          </FormField>
          <FormField label="Department" required>
            <Select name="department" value={form.department} onChange={handleChange} options={DEPARTMENTS} />
          </FormField>
          <FormField label="Role" required>
            <Select name="role" value={form.role} onChange={handleChange} options={ROLES} />
          </FormField>
          <FormField label="Phone Number (Optional)" style={{ gridColumn: '1 / -1' }}>
            <Input name="phone" value={form.phone} onChange={handleChange} placeholder="0803 456 7890" />
          </FormField>
        </div>
      </form>
    </Drawer>
  );
}

// ─── View User Drawer ─────────────────────────────────────────────────────────
function ViewUserDrawer({ isOpen, onClose, user, onEdit }) {
  const [tab, setTab] = useState('details');
  if (!user) return null;

  const tabStyle = (t) => ({
    padding: '10px 0',
    fontSize: '0.875rem',
    fontWeight: tab === t ? 700 : 500,
    color: tab === t ? '#1D4ED8' : '#64748B',
    border: 'none',
    borderBottom: tab === t ? '2px solid #1D4ED8' : '2px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    marginBottom: -1,
    transition: 'color 0.15s ease',
  });

  const detailItem = (label, value) => (
    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiUser size={16} color="#1D4ED8" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400 }}>{user.id} · {user.email}</div>
          </div>
        </div>
      }
      width="520px"
    >
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
          <StatusPill status={user.status} />
        </div>
        <button onClick={onEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
          <FiEdit2 size={13} /> Edit User
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <button style={tabStyle('details')} onClick={() => setTab('details')}>Details</button>
        <button style={tabStyle('audit')} onClick={() => setTab('audit')}>Audit Trail</button>
      </div>

      {/* Details Tab */}
      {tab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
          {detailItem('User ID', user.id)}
          {detailItem('First Name', user.firstName)}
          {detailItem('Last Name', user.lastName)}
          {detailItem('Work Email', user.email)}
          {detailItem('Department', user.department)}
          {detailItem('Role', user.role)}
          {detailItem('Phone Number', user.phone)}
          {detailItem('Joined', user.joined)}
          {detailItem('Last Active', user.lastActive)}
          {detailItem('Status', user.status)}
        </div>
      )}

      {/* Audit Trail Tab */}
      {tab === 'audit' && (
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '10px 14px' }}>
            {['Date & Time', 'Action', 'Changed By'].map((h) => (
              <span key={h} style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B' }}>{h}</span>
            ))}
          </div>
          {AUDIT_LOGS.map((log, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '12px 14px', borderBottom: i === AUDIT_LOGS.length - 1 ? 'none' : '1px solid #F1F5F9', fontSize: '0.813rem' }}>
              <span style={{ color: '#475569' }}>{log.date}</span>
              <span style={{ color: '#0F172A', fontWeight: 500 }}>{log.action}</span>
              <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{log.by}</span>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

// ─── Confirm Action Modal (compact overlay — kept as small dialog per screenshots) ──
const ACTION_CONFIGS = {
  suspend: {
    title: 'Suspend User?',
    desc: 'This will prevent the user from signing in to PGSL ERP. Their account and existing records will remain in the system.',
    btnLabel: 'Suspend User',
    btnColor: '#DC2626',
    icon: <FiUserX size={14} />,
    hasReason: true,
  },
  deactivate: {
    title: 'Deactivate User?',
    desc: 'This will deactivate the user\'s account and prevent access to PGSL ERP.',
    btnLabel: 'Deactivate User',
    btnColor: '#DC2626',
    icon: <FiUserX size={14} />,
    hasReason: true,
  },
  cancelInvite: {
    title: 'Cancel Invitation?',
    desc: 'This will invalidate the current invitation link. The user will not be able to activate their account using this invitation.',
    btnLabel: 'Cancel Invitation',
    btnColor: '#DC2626',
    icon: <FiX size={14} />,
    hasReason: true,
  },
  resend: {
    title: 'Resend Invitation?',
    desc: 'A new invitation link will be sent to the user\'s work email so they can complete their account setup.',
    btnLabel: 'Resend Invite',
    btnColor: '#1D4ED8',
    icon: <FiMail size={14} />,
    hasReason: false,
  },
  reactivate: {
    title: 'Reactivate User?',
    desc: 'This will restore the user\'s access to PGSL ERP.',
    btnLabel: 'Reactivate User',
    btnColor: '#16A34A',
    icon: <FiUserCheck size={14} />,
    hasReason: false,
  },
  resetPwd: {
    title: 'Send Password Reset?',
    desc: 'A password reset link will be sent to the user\'s work email.',
    btnLabel: 'Send Reset Link',
    btnColor: '#1D4ED8',
    icon: <FiKey size={14} />,
    hasReason: false,
  },
};

function ConfirmActionModal({ isOpen, onClose, onConfirm, user, actionKey }) {
  const [reason, setReason] = useState('');
  const cfg = ACTION_CONFIGS[actionKey];
  if (!isOpen || !cfg || !user) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'var(--font)' }}>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', zIndex: 2001, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{cfg.title}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>{cfg.desc}</div>
        </div>
        <div style={{ marginBottom: cfg.hasReason ? 16 : 24 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>{user.firstName} {user.lastName}</div>
          <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{user.email}</div>
        </div>
        {cfg.hasReason && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', marginBottom: 6 }}>
              REASON <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add reason..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '0.875rem', fontFamily: 'var(--font)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#0F172A' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button
            onClick={() => { onConfirm(reason); setReason(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: cfg.btnColor, color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {cfg.icon} {cfg.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserManagement() {
  const { toast, showToast, hideToast } = useToast();
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Drawer / modal states
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, user: null, key: null });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.id.toLowerCase().includes(q) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
  const handleSelectAll = () => selectedIds.length === paginated.length ? setSelectedIds([]) : setSelectedIds(paginated.map((u) => u.id));

  const handleSave = (form) => {
    if (editTarget) {
      setUsers((p) => p.map((u) => u.id === editTarget.id ? { ...u, ...form } : u));
      setEditTarget(null);
      showToast('User updated successfully', 'success');
    } else {
      const newId = `USR-${String(users.length + 1).padStart(3, '0')}`;
      setUsers((p) => [{ ...form, id: newId, lastActive: '-', status: 'Invited', joined: new Date().toLocaleDateString('en-GB').replace(/\//g, '/') }, ...p]);
      setAddOpen(false);
      showToast('Invite sent successfully', 'success');
    }
  };

  const handleConfirmAction = (reason) => {
    const { user, key } = actionModal;
    const statusMap = { suspend: 'Suspended', deactivate: 'Deactivated', reactivate: 'Active' };
    if (statusMap[key]) {
      setUsers((p) => p.map((u) => u.id === user.id ? { ...u, status: statusMap[key] } : u));
    }
    const msgMap = {
      suspend: `${user.firstName} ${user.lastName} has been suspended`,
      deactivate: `${user.firstName} ${user.lastName} has been deactivated`,
      cancelInvite: `Invitation cancelled for ${user.firstName} ${user.lastName}`,
      resend: `Invitation resent to ${user.email}`,
      reactivate: `${user.firstName} ${user.lastName} has been reactivated`,
      resetPwd: `Password reset link sent to ${user.email}`,
    };
    const typeMap = { suspend: 'error', deactivate: 'error', cancelInvite: 'error', resend: 'success', reactivate: 'success', resetPwd: 'success' };
    showToast(msgMap[key], typeMap[key]);
    setActionModal({ open: false, user: null, key: null });
  };

  const columns = [
    {
      key: 'id', label: 'USER ID',
      render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600, fontSize: '0.813rem' }}>{val}</span>,
    },
    {
      key: 'firstName', label: 'NAME',
      render: (val, row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{row.firstName} {row.lastName}</span>,
    },
    { key: 'email', label: 'EMAIL', render: (val) => <span style={{ color: '#475569' }}>{val}</span> },
    {
      key: 'department', label: 'DEPARTMENT',
      render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{val}</span>,
    },
    { key: 'role', label: 'ROLE' },
    { key: 'lastActive', label: 'LAST ACTIVE', nowrap: true },
    {
      key: 'status', label: 'STATUS',
      render: (val) => <StatusPill status={val} />,
    },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <button className="icon-btn" onClick={() => setViewTarget(row)} title="View User"><FiEye size={15} /></button>
          <RowMenu
            user={row}
            onView={() => setViewTarget(row)}
            onEdit={() => setEditTarget(row)}
            onAction={(key) => setActionModal({ open: true, user: row, key })}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Users</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Manage user accounts, roles, and access to the PGSL ERP.
        </p>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search User ID, Name..."
              style={{ paddingLeft: 36 }}
            />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            <FiFilter size={14} /> Filter
          </button>
          <button className="btn btn-secondary" onClick={() => showToast('Exporting users...', 'info')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            Export <FiDownload size={14} />
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setAddOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: 6, fontWeight: 600, border: 'none' }}
          >
            <FiPlus size={14} /> Add User
          </button>
        </div>

        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No users found matching your search."
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Drawers */}
      <UserFormDrawer isOpen={addOpen} onClose={() => setAddOpen(false)} onSave={handleSave} user={null} />
      {editTarget && (
        <UserFormDrawer isOpen={!!editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} user={editTarget} />
      )}
      <ViewUserDrawer
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        user={viewTarget}
        onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
      />

      {/* Compact confirm dialogs (suspend/deactivate/etc.) */}
      <ConfirmActionModal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, user: null, key: null })}
        onConfirm={handleConfirmAction}
        user={actionModal.user}
        actionKey={actionModal.key}
      />
    </div>
  );
}
