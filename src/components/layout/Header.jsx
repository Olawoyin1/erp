import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiChevronDown, FiPlus, FiMenu, FiCheck, FiCheckCircle } from 'react-icons/fi';
import {
  fetchUnreadCount,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../store/notifications/notificationsSlice';

// ─── Notification type → icon color ──────────────────────────────────────────
function notifDotColor(priority) {
  if (priority === 'P0') return '#DC2626';
  if (priority === 'P1') return '#F59E0B';
  return '#1D4ED8';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Notification Dropdown ────────────────────────────────────────────────────
function NotificationPanel({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, loading } = useSelector((s) => s.notifications);

  const handleMarkRead = (e, id) => {
    e.stopPropagation();
    dispatch(markNotificationRead(id));
  };

  const handleMarkAll = () => dispatch(markAllNotificationsRead());

  const handleClick = (notif) => {
    if (!notif.readAt) dispatch(markNotificationRead(notif._id));
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
        width: 360, backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0', borderRadius: 10,
        boxShadow: '0 12px 40px rgba(15,23,42,0.15)',
        zIndex: 1200, overflow: 'hidden',
        fontFamily: 'var(--font)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>Notifications</span>
        <button
          onClick={handleMarkAll}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
        >
          <FiCheckCircle size={13} /> Mark all read
        </button>
      </div>

      {/* List */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.813rem' }}>Loading…</div>
        )}
        {!loading && notifications.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.813rem' }}>
            <FiBell size={22} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
            No notifications yet
          </div>
        )}
        {!loading && notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => handleClick(n)}
            style={{
              display: 'flex', gap: 12, padding: '12px 16px',
              borderBottom: '1px solid #F8FAFC',
              backgroundColor: n.readAt ? '#FFFFFF' : '#F0F7FF',
              cursor: n.link ? 'pointer' : 'default',
              transition: 'background 0.12s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = n.readAt ? '#F8FAFC' : '#E0F0FF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.readAt ? '#FFFFFF' : '#F0F7FF'; }}
          >
            {/* Priority dot */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
              backgroundColor: n.readAt ? '#CBD5E1' : notifDotColor(n.priority),
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.813rem', fontWeight: n.readAt ? 400 : 600, color: '#0F172A', lineHeight: 1.4 }}>
                {n.title}
              </div>
              {n.body && (
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.body}
                </div>
              )}
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
            </div>
            {!n.readAt && (
              <button
                onClick={(e) => handleMarkRead(e, n._id)}
                title="Mark as read"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', flexShrink: 0, padding: 2, borderRadius: 4, display: 'flex', alignItems: 'flex-start' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1D4ED8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <FiCheck size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
        <button
          onClick={() => { navigate('/notifications'); onClose(); }}
          style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 60_000; // poll unread count every 60s

export default function Header({ onMobileToggle }) {
  const dispatch = useDispatch();
  const { unreadCount } = useSelector((s) => s.notifications);
  const { user } = useSelector((s) => s.auth);

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef();

  // Poll unread count on mount + every 60s
  const pollCount = useCallback(() => dispatch(fetchUnreadCount()), [dispatch]);
  useEffect(() => {
    pollCount();
    const id = setInterval(pollCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pollCount]);

  // Fetch notification list when panel opens
  useEffect(() => {
    if (bellOpen) dispatch(fetchNotifications({ page: 1, limit: 20 }));
  }, [bellOpen, dispatch]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'CD';
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Chioma Davids';
  const displayRole = user?.roles?.[0] || 'Super Admin';

  return (
    <header className="header">
      <button className="header-mobile-toggle" onClick={onMobileToggle} title="Open navigation menu">
        <FiMenu size={18} />
      </button>

      <div className="header-search">
        <span className="header-search-icon"><FiSearch size={15} /></span>
        <input type="text" placeholder="Search clients, RFQs, opportunity value, assignees..." />
      </div>

      <div className="header-actions">
        <button className="btn-quick-actions">
          <FiPlus size={14} /> Quick Actions <FiChevronDown size={13} />
        </button>

        {/* Bell icon with live badge + dropdown */}
        <div style={{ position: 'relative' }} ref={bellRef}>
          <button
            className="header-icon-btn"
            onClick={() => setBellOpen((v) => !v)}
            aria-label={`Notifications — ${unreadCount} unread`}
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge" style={{ minWidth: 16, textAlign: 'center' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && <NotificationPanel onClose={() => setBellOpen(false)} />}
        </div>

        <div className="header-divider" />

        <div className="header-user">
          <div className="header-avatar">{initials}</div>
          <div className="header-user-info">
            <span className="header-user-name">{displayName}</span>
            <span className="header-user-role">{displayRole}</span>
          </div>
          <FiChevronDown size={13} style={{ color: '#94a3b8' }} />
        </div>
      </div>
    </header>
  );
}
