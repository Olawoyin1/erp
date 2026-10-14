import { STATUS_STYLES } from './trainingConstants';

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#F1F5F9', color: '#64748B', label: status || '—' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}
