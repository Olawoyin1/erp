const LABELS = {
  'auth.login': 'Signed in',
  'user.invited': 'Invitation sent',
  'user.invite_resent': 'Invitation resent',
  'user.invite_cancelled': 'Invitation cancelled',
  'user.password_reset_sent': 'Password reset link sent',
  'user.roles_changed': 'Roles changed',
  'user.profile_updated': 'Profile updated',
  'user.status.active': 'Account activated',
  'user.status.suspended': 'Account suspended',
  'user.status.deactivated': 'Account deactivated',
  'role.created': 'Role created',
  'role.updated': 'Role updated',
  'role.deleted': 'Role deleted',
};

/** Human wording for an audit `action` key (known keys are worded by hand, others are title-cased). */
export function auditActionLabel(action) {
  if (LABELS[action]) return LABELS[action];
  return String(action || '')
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** The reason recorded with a status change or invite cancellation, if any. */
export function auditReason(entry) {
  return entry?.after?.reason || null;
}
