const STYLES = {
  active: { label: 'Active', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  invited: { label: 'Invited', bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA' },
  suspended: { label: 'Suspended', bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A' },
  deactivated: { label: 'Deactivated', bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
};

/** Coloured pill for a user account status (`active`, `invited`, `suspended`, `deactivated`). */
export default function StatusPill({ status }) {
  const s = STYLES[status] || STYLES.deactivated;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}
