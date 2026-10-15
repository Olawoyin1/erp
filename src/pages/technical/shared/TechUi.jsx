import { useState } from 'react';
import { FiEye } from 'react-icons/fi';
import RowMenu from '../../../components/ui/RowMenu';
import { statusLabel } from './techUtils';

const TONES = {
  green: { bg: '#DCFCE7', fg: '#166534' },
  blue: { bg: '#DBEAFE', fg: '#1D4ED8' },
  amber: { bg: '#FEF3C7', fg: '#B45309' },
  orange: { bg: '#FFEDD5', fg: '#C2410C' },
  red: { bg: '#FEE2E2', fg: '#B91C1C' },
  purple: { bg: '#EDE9FE', fg: '#6D28D9' },
  slate: { bg: '#F1F5F9', fg: '#475569' },
};

const STATUS_TONE = {
  in_progress: 'blue', on_hold: 'orange', at_risk: 'amber', delayed: 'red', completed: 'green', pending: 'slate',
  monitoring: 'amber', mitigated: 'green', occurred: 'red', open: 'amber', resolved: 'green', pending_approval: 'amber', approved: 'green', rejected: 'red',
  technical_reviewing: 'amber', store_reviewing: 'amber', issued: 'blue', returned: 'purple', unavailable: 'red', cancelled: 'slate', rejected_by_technical: 'red',
  draft: 'slate', submitted: 'blue', signed_off: 'green',
  under_review: 'blue', checked: 'purple', sent_to_client: 'purple',
  valid: 'green', due_soon: 'amber', overdue: 'red', out_of_service: 'slate',
  Hot: 'red', High: 'red', Medium: 'amber', Low: 'blue',
  Pass: 'green', Fail: 'red', None: 'slate',
};

export function TechBadge({ status, label }) {
  const tone = TONES[STATUS_TONE[status] || 'slate'];
  return (
    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: tone.bg, color: tone.fg, whiteSpace: 'nowrap' }}>
      {label || statusLabel(status)}
    </span>
  );
}

/** Priority shown as coloured text, as in the designs' tables. */
export function PriorityText({ value }) {
  const tone = TONES[STATUS_TONE[value] || 'slate'];
  return <span style={{ color: tone.fg, fontWeight: 600 }}>{value || '—'}</span>;
}

/** A thin progress bar with its percentage, used for WBS, milestones and project progress. */
export function ProgressBar({ value, color = '#1D4ED8', width = 80 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, minWidth: width, height: 6, borderRadius: 3, background: '#E2E8F0' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color }} />
      </div>
      <span style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>{pct}%</span>
    </div>
  );
}

/** Row actions: the eye (view) button plus the kebab menu when the row has any actions. */
export function RowActions({ onView, items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
      {onView && <button type="button" className="icon-btn" title="View" onClick={onView}><FiEye size={15} /></button>}
      {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
    </div>
  );
}

/** Tabs inside a View drawer (Overview / Approval Log, Details / History, Overview / Timeline). */
export function DrawerTabs({ tabs, children }) {
  const [active, setActive] = useState(tabs[0].id);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font)',
              borderBottom: active === tab.id ? '2px solid #1D4ED8' : '2px solid transparent', color: active === tab.id ? '#1D4ED8' : '#64748B',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
}

/** The activity trail ("Approval Log", "Timeline", "History") as dated dots. */
export function Trail({ events, empty = 'Nothing has happened yet.' }) {
  if (!events.length) return <div style={{ color: '#94A3B8', fontSize: '0.84rem', padding: '12px 0' }}>{empty}</div>;
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {events.map((event, i) => (
        <div key={event._id || i} style={{ display: 'flex', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: i === events.length - 1 ? '#F59E0B' : i === 0 ? '#1E3A8A' : '#22C55E' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{new Date(event.occurredAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{event.label}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {event.actorName}{event.reason ? ` · ${event.reason}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
