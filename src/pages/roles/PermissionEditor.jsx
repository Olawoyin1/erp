import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import {
  UI_MODULES, UI_ACTIONS, ACTION_LABELS, RESOURCE_LABELS, platformGroups,
} from './permissionPresets';

const headCell = { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#1D4ED8' };

/** The 8 module x 4 action checkbox grid. */
export function PermissionMatrix({ grid, onChange, readOnly = false }) {
  const toggle = (label, key) => {
    if (readOnly) return;
    onChange({ ...grid, [label]: { ...grid[label], [key]: !grid[label]?.[key] } });
  };

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 80px 90px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ padding: '8px 14px', ...headCell }}>Module</div>
        {UI_ACTIONS.map((k) => (
          <div key={k} style={{ padding: '8px 0', textAlign: 'center', ...headCell }}>{ACTION_LABELS[k]}</div>
        ))}
      </div>
      {UI_MODULES.map((mod, idx) => (
        <div
          key={mod.label}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 70px 70px 80px 90px', alignItems: 'center',
            borderBottom: idx === UI_MODULES.length - 1 ? 'none' : '1px solid #F1F5F9',
            backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
          }}
        >
          <div style={{ padding: '9px 14px', fontSize: '0.85rem', color: '#0F172A' }}>{mod.label}</div>
          {UI_ACTIONS.map((action) => (
            <div key={action} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <input
                type="checkbox"
                aria-label={`${mod.label} ${ACTION_LABELS[action]}`}
                checked={!!grid[mod.label]?.[action]}
                onChange={() => toggle(mod.label, action)}
                disabled={readOnly}
                style={{ accentColor: '#1D4ED8', cursor: readOnly ? 'default' : 'pointer', width: 15, height: 15 }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Platform permissions (users, roles, settings, documents, tasks, audit log, dashboard). The module grid never
 * grants these, so without this panel a custom role could not even open the dashboard.
 */
export function PlatformPermissions({ catalogue, selected, onChange, readOnly = false }) {
  const groups = platformGroups(catalogue);
  const [open, setOpen] = useState(() => selected.length > 0);
  const chosen = new Set(selected);

  const toggle = (key) => {
    if (readOnly) return;
    const next = new Set(chosen);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', backgroundColor: '#F8FAFC', cursor: 'pointer', fontFamily: 'var(--font)' }}
      >
        {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>Platform permissions</span>
        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{selected.length} selected</span>
      </button>
      {open && (
        <div style={{ padding: '6px 14px 12px' }}>
          {groups.map((group) => {
            const label = RESOURCE_LABELS[`${group.namespace}.${group.resource}`] || group.resource;
            return (
              <div key={`${group.namespace}.${group.resource}`} style={{ padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                  {group.keys.map(({ action, key }) => (
                    <label key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#475569', cursor: readOnly ? 'default' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={chosen.has(key)}
                        disabled={readOnly}
                        onChange={() => toggle(key)}
                        style={{ accentColor: '#1D4ED8' }}
                      />
                      {action}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Every real permission key of a role, grouped by `module.resource`. */
export function PermissionKeyList({ permissions }) {
  const groups = {};
  (permissions || []).forEach((key) => {
    const [namespace, resource, ...rest] = key.split('.');
    const group = `${namespace}.${resource}`;
    (groups[group] = groups[group] || []).push(rest.join('.'));
  });
  const names = Object.keys(groups).sort();

  if (names.length === 0) {
    return <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>This role holds no permissions.</div>;
  }
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, maxHeight: 260, overflowY: 'auto' }}>
      {names.map((name) => (
        <div key={name} style={{ padding: '8px 14px', borderBottom: '1px solid #F1F5F9', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 600, color: '#334155' }}>{name}</span>
          <span style={{ color: '#64748B' }}>: {groups[name].join(', ')}</span>
        </div>
      ))}
    </div>
  );
}
