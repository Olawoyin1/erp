import apiClient from './apiClient';

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationService = {
  // GET /notifications — paginated; supports unread=true, page, limit
  list: (params) => apiClient.get('/notifications', { params }),

  // GET /notifications/unread-count → { data: { count: N } }
  unreadCount: () => apiClient.get('/notifications/unread-count'),

  // POST /notifications/:id/read
  markRead: (id) => apiClient.post(`/notifications/${id}/read`),

  // POST /notifications/read-all
  markAllRead: () => apiClient.post('/notifications/read-all'),
};
