import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiBell, FiChevronDown, FiPlus, FiMenu, FiCheck, FiCheckCircle,
  FiLogOut, FiSettings, FiKey, FiUser, FiArrowRight,
} from 'react-icons/fi';
import {
  fetchUnreadCount,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../store/notifications/notificationsSlice';
import { logoutUser } from '../../store/authSlice';
import { usePermissions } from '../../hooks/usePermission';
import { searchablePages } from './navConfig';
import { resolveNotificationTarget, notifDotColor, timeAgo } from './notificationLinks';

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

const menuStyle = {
  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
  backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
  boxShadow: '0 12px 40px rgba(15,23,42,0.15)', zIndex: 1200, overflow: 'hidden',
  fontFamily: 'var(--font)',
};

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px',
  fontSize: '0.82rem', color: '#334155', background: 'none', border: 'none', cursor: 'pointer',
  textAlign: 'left', fontFamily: 'var(--font)',
};

// ─── Notification dropdown ────────────────────────────────────────────────────
function NotificationPanel({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, loading, error } = useSelector((s) => s.notifications);

  const handleMarkRead = (e, id) => {
    e.stopPropagation();
    dispatch(markNotificationRead(id));
  };

  const handleClick = async (notif) => {
    if (!notif.readAt) dispatch(markNotificationRead(notif._id));
    if (!notif.link) return;
    const target = await resolveNotificationTarget(notif.link);
    if (target) {
      navigate(target);
      onClose();
    }
  };

  return (
    <div style={{ ...menuStyle, width: 360, maxWidth: 'calc(100vw - 24px)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>Notifications</span>
        <button
          onClick={() => dispatch(markAllNotificationsRead())}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
        >
          <FiCheckCircle size={13} /> Mark all read
        </button>
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {loading && notifications.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.813rem' }}>Loading...</div>
        )}
        {error && notifications.length === 0 && (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: '#DC2626', fontSize: '0.813rem' }}>{error}</div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.813rem' }}>
            <FiBell size={22} style={{ display: 'block', margin: '0 auto 8px' }} />
            No notifications yet
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => handleClick(n)}
            style={{
              display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F8FAFC',
              backgroundColor: n.readAt ? '#FFFFFF' : '#F0F7FF', cursor: n.link ? 'pointer' : 'default',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5, backgroundColor: n.readAt ? '#CBD5E1' : notifDotColor(n.priority) }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.813rem', fontWeight: n.readAt ? 400 : 600, color: '#0F172A', lineHeight: 1.4 }}>{n.title}</div>
              {n.body && (
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
              )}
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
            </div>
            {!n.readAt && (
              <button
                onClick={(e) => handleMarkRead(e, n._id)}
                title="Mark as read"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', flexShrink: 0, padding: 2, display: 'flex', alignItems: 'flex-start' }}
              >
                <FiCheck size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
        <button
          onClick={() => { navigate('/notifications'); onClose(); }}
          style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          View all notifications <FiArrowRight size={12} style={{ verticalAlign: 'middle' }} />
        </button>
      </div>
    </div>
  );
}

// ─── Page search ──────────────────────────────────────────────────────────────
function PageSearch() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(ref, close);

  const q = query.trim().toLowerCase();
  const matches = q
    ? searchablePages(can).filter((p) => `${p.label} ${p.group}`.toLowerCase().includes(q)).slice(0, 8)
    : [];

  const go = (path) => {
    navigate(path);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="header-search" ref={ref} style={{ position: 'relative' }}>
      <span className="header-search-icon"><FiSearch size={15} /></span>
      <input
        type="text"
        placeholder="Search pages: employees, invoices, leave..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) go(matches[0].path);
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && query.trim() && (
        <div style={{ ...menuStyle, left: 0, right: 'auto', width: '100%', minWidth: 280 }}>
          {matches.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#94A3B8' }}>No page matches "{query}"</div>
          )}
          {matches.map((p) => (
            <button key={p.path} onClick={() => go(p.path)} style={{ ...menuItemStyle, justifyContent: 'space-between' }}>
              <span>{p.label}</span>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{p.group}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quick actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Invite a user', path: '/users', permission: 'core.user.create' },
  { label: 'Add an employee', path: '/hr/employees', permission: 'hr.employee.create' },
  { label: 'Request leave', path: '/hr/leave', permission: 'hr.leave.create' },
  { label: 'Raise a purchase requisition', path: '/procurement/requests', permission: 'procurement.requisition.create' },
  { label: 'Create an invoice', path: '/finance/invoicing', permission: 'finance.invoice.create' },
  { label: 'Upload a document', path: '/administration/documents', permission: 'core.document.create' },
  { label: 'Send a memo', path: '/administration/memos', permission: 'administration.memo.send' },
];

function QuickActions() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(ref, close);
  const actions = QUICK_ACTIONS.filter((a) => can(a.permission));
  if (actions.length === 0) return null;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="btn-quick-actions" onClick={() => setOpen((v) => !v)}>
        <FiPlus size={14} /> Quick Actions <FiChevronDown size={13} />
      </button>
      {open && (
        <div style={{ ...menuStyle, width: 250 }}>
          {actions.map((a) => (
            <button key={a.path + a.label} onClick={() => { navigate(a.path); setOpen(false); }} style={menuItemStyle}>
              <FiPlus size={13} /> {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── User menu ────────────────────────────────────────────────────────────────
function UserMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const roleSlugs = useSelector((s) => s.auth.roles);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(ref, close);

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '';
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const roleNames = (user?.roles || []).map((r) => (typeof r === 'object' ? r?.name : null)).filter(Boolean);
  const displayRole = roleNames.length ? roleNames.join(', ') : roleSlugs.join(', ') || 'No role assigned';

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div className="header-user" onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer' }}>
        <div className="header-avatar">{initials || <FiUser size={14} />}</div>
        <div className="header-user-info">
          <span className="header-user-name">{displayName || 'Signed in'}</span>
          <span className="header-user-role">{displayRole}</span>
        </div>
        <FiChevronDown size={13} style={{ color: '#94a3b8' }} />
      </div>
      {open && (
        <div style={{ ...menuStyle, width: 250 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{displayName}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', wordBreak: 'break-all' }}>{user?.email}</div>
          </div>
          <button onClick={() => { navigate('/settings'); setOpen(false); }} style={menuItemStyle}>
            <FiSettings size={14} /> Profile &amp; settings
          </button>
          <button onClick={() => { navigate('/settings?tab=password'); setOpen(false); }} style={menuItemStyle}>
            <FiKey size={14} /> Change password
          </button>
          <button onClick={() => dispatch(logoutUser())} style={{ ...menuItemStyle, color: '#DC2626', borderTop: '1px solid #F1F5F9' }}>
            <FiLogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 60_000;

export default function Header({ onMobileToggle }) {
  const dispatch = useDispatch();
  const { unreadCount } = useSelector((s) => s.notifications);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef();
  const closeBell = useCallback(() => setBellOpen(false), []);
  useOutsideClose(bellRef, closeBell);

  // Unread count: on mount, every minute while the tab is visible, and when the tab comes back.
  useEffect(() => {
    const poll = () => { if (!document.hidden) dispatch(fetchUnreadCount()); };
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', poll);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [dispatch]);

  useEffect(() => {
    if (bellOpen) dispatch(fetchNotifications({ page: 1, limit: 20 }));
  }, [bellOpen, dispatch]);

  return (
    <header className="header">
      <button className="header-mobile-toggle" onClick={onMobileToggle} title="Open navigation menu">
        <FiMenu size={18} />
      </button>

      <PageSearch />

      <div className="header-actions">
        <QuickActions />

        <div style={{ position: 'relative' }} ref={bellRef}>
          <button
            className="header-icon-btn"
            onClick={() => setBellOpen((v) => !v)}
            aria-label={`Notifications, ${unreadCount} unread`}
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge" style={{ minWidth: 16, textAlign: 'center' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {bellOpen && <NotificationPanel onClose={closeBell} />}
        </div>

        <div className="header-divider" />

        <UserMenu />
      </div>
    </header>
  );
}
