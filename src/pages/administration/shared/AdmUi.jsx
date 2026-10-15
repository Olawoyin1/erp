import { formatDateTime } from '../../procurement/shared/procUtils';
import { useFetched } from '../../procurement/shared/procHooks';
import { Skeleton, StatusBadge } from '../../procurement/shared/ProcUi';

const TONE_STATUS = { green: 'active', amber: 'pending', red: 'rejected', sky: 'issued', blue: 'issued', purple: 'awarded', slate: 'draft' };

/** A rounded status pill in one of the shared tones (green, amber, red, sky, purple, slate). */
export function Pill({ tone = 'slate', children }) {
  return <StatusBadge status={TONE_STATUS[tone] || 'draft'} label={children} />;
}

const DOT = { done: '#16A34A', waiting: '#F59E0B', start: '#1E3A8A', bad: '#DC2626' };

const BAD_ACTIONS = /rejected|cancelled/;

function dotColor(event, index) {
  if (BAD_ACTIONS.test(event.action || '') || event.toStatus === 'rejected' || event.toStatus === 'cancelled') return DOT.bad;
  return index === 0 ? DOT.start : DOT.done;
}

/**
 * The "Approval History" / "Chain of Custody" list of the designs: a coloured dot, date and time, a title and a grey
 * "by <name>" line. `pending` rows (steps still to come) get an amber dot and an "Awaiting action" line.
 */
export function Timeline({ title, events, pending = [], loading, error, empty = 'Nothing has been recorded yet.', footer }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
      {loading && <Skeleton height={60} />}
      {error && <span style={{ fontSize: '0.8rem', color: '#991B1B' }}>{error}</span>}
      {!loading && !error && events.length === 0 && pending.length === 0 && <span style={{ fontSize: '0.84rem', color: '#94A3B8' }}>{empty}</span>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {events.map((event, i) => (
          <div key={event._id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor(event, i), marginTop: 5, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{formatDateTime(event.occurredAt)}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', wordBreak: 'break-word' }}>{event.label}</div>
              {event.actorName && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>by {event.actorName}</div>}
              {event.reason && <div style={{ fontSize: '0.75rem', color: '#991B1B' }}>Reason: {event.reason}</div>}
            </div>
          </div>
        ))}
        {pending.map((step) => (
          <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: DOT.waiting, marginTop: 5, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{step}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Awaiting action</div>
            </div>
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}

/** A timeline loaded from an activity endpoint (`api.history(id, params)` or `api.chainOfCustody`). Mount with `key={id}`. */
export function HistoryTimeline({ load, id, refreshKey = 0, title, pending, empty, footer }) {
  const { data, error, loading } = useFetched(() => load(id, { order: 'asc', limit: 100 }), id, refreshKey);
  return <Timeline title={title} events={data} pending={pending} loading={loading} error={error} empty={empty} footer={footer} />;
}
