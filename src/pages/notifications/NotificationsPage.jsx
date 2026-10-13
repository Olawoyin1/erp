import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiCheckCircle } from 'react-icons/fi';
import Pagination from '../../components/ui/Pagination';
import Toast, { useToast } from '../../components/ui/Toast';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../store/notifications/notificationsSlice';
import { resolveNotificationTarget, notifDotColor, timeAgo } from '../../components/layout/notificationLinks';

const PAGE_SIZE = 20;

const tabStyle = (active) => ({
  padding: '10px 0',
  fontSize: '0.875rem',
  fontWeight: active ? 700 : 500,
  color: active ? '#1D4ED8' : '#64748B',
  border: 'none',
  borderBottom: active ? '2px solid #1D4ED8' : '2px solid transparent',
  backgroundColor: 'transparent',
  cursor: 'pointer',
});

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { notifications, meta, loading, error, unreadCount } = useSelector((s) => s.notifications);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchNotifications({ page, limit: PAGE_SIZE, ...(unreadOnly ? { unread: true } : {}) }));
  }, [dispatch, page, unreadOnly]);

  const open = async (n) => {
    if (!n.readAt) dispatch(markNotificationRead(n._id));
    if (!n.link) return;
    const target = await resolveNotificationTarget(n.link);
    if (target) navigate(target);
    else showToast('That record has no page to open in this app yet.', 'info');
  };

  const readAll = async () => {
    const result = await dispatch(markAllNotificationsRead());
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('All notifications marked as read', 'success');
      dispatch(fetchUnreadCount());
    } else {
      showToast(result.payload || 'Could not mark notifications as read', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{'@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Notifications</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Approvals, deadlines and updates addressed to you. {unreadCount > 0 ? `${unreadCount} unread.` : 'You are all caught up.'}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={readAll}
          disabled={unreadCount === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
        >
          <FiCheckCircle size={14} /> Mark all read
        </button>
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E2E8F0' }}>
          <button style={tabStyle(!unreadOnly)} onClick={() => { setUnreadOnly(false); setPage(1); }}>All</button>
          <button style={tabStyle(unreadOnly)} onClick={() => { setUnreadOnly(true); setPage(1); }}>Unread</button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button
              onClick={() => dispatch(fetchNotifications({ page, limit: PAGE_SIZE, ...(unreadOnly ? { unread: true } : {}) }))}
              style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 600, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {loading && notifications.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map((k) => (
              <div key={k} style={{ height: 58, borderRadius: 8, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))}
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
            <FiBell size={26} style={{ display: 'block', margin: '0 auto 10px' }} />
            {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
          </div>
        )}

        {notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => open(n)}
            style={{
              display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 8, border: '1px solid #F1F5F9',
              backgroundColor: n.readAt ? '#FFFFFF' : '#F0F7FF', cursor: n.link ? 'pointer' : 'default',
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, marginTop: 6, backgroundColor: n.readAt ? '#CBD5E1' : notifDotColor(n.priority) }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: n.readAt ? 500 : 700, color: '#0F172A' }}>{n.title}</div>
              {n.body && <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>}
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 6 }}>{timeAgo(n.createdAt)}</div>
            </div>
            {!n.readAt && (
              <button
                title="Mark as read"
                onClick={(e) => { e.stopPropagation(); dispatch(markNotificationRead(n._id)); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', alignSelf: 'flex-start' }}
              >
                <FiCheck size={15} />
              </button>
            )}
          </div>
        ))}

        <Pagination currentPage={page} totalPages={meta?.totalPages || 1} onPageChange={setPage} />
      </div>
    </div>
  );
}
