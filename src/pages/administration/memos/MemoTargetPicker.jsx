import { useMemo } from 'react';
import { FiX } from 'react-icons/fi';
import { Choice } from '../../procurement/shared/ProcUi';

const keyOf = (t) => `${t.type}:${t.refId || ''}`;

/** The recipient options a memo can be addressed to: everyone, a department, a role or one person. */
function targetOptions(lookups) {
  return [
    { key: 'all_staff:', target: { type: 'all_staff', label: 'All Staff' } },
    ...(lookups.departments || []).map((d) => ({ key: `department:${d._id}`, target: { type: 'department', refId: d._id, label: d.name } })),
    ...(lookups.roles || []).map((r) => ({ key: `role:${r._id}`, target: { type: 'role', refId: r._id, label: r.name } })),
    ...(lookups.users || []).map((u) => ({ key: `user:${u._id}`, target: { type: 'user', refId: u._id, label: `${u.firstName} ${u.lastName}`.trim() } })),
  ];
}

const GROUP = { all_staff: 'Everyone', department: 'Department', role: 'Role', user: 'Person' };

/** Multi-select of memo recipients: pick from the list, remove with the cross. */
export default function MemoTargetPicker({ value, onChange, lookups, placeholder = 'Add a recipient', error }) {
  const options = useMemo(() => targetOptions(lookups), [lookups]);
  const chosen = new Set(value.map(keyOf));
  const available = options
    .filter((o) => !chosen.has(o.key))
    .map((o) => ({ value: o.key, label: o.target.type === 'all_staff' ? o.target.label : `${GROUP[o.target.type]}: ${o.target.label}` }));

  const add = (key) => {
    const found = options.find((o) => o.key === key);
    if (!found) return;
    const next = found.target.type === 'all_staff' ? [found.target] : [...value.filter((t) => t.type !== 'all_staff'), found.target];
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Choice value="" onChange={add} searchable placeholder={placeholder} options={available} error={error} />
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {value.map((t) => (
            <span key={keyOf(t)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#1E3A8A', borderRadius: 999, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
              {t.label}
              <button type="button" aria-label={`Remove ${t.label}`} onClick={() => onChange(value.filter((x) => keyOf(x) !== keyOf(t)))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1E3A8A', display: 'flex', padding: 0 }}>
                <FiX size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
