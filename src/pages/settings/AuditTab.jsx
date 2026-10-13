import { useState } from 'react';
import { FormField, Input, Select } from '../../components/ui/FormField';
import Pagination from '../../components/ui/Pagination';
import { auditService } from '../../services/platform.service';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { auditActionLabel, formatDateTime } from '../users/auditFormat';
import { EmptyState, ErrorBanner, PanelHeader, PanelSkeleton, SectionCard } from './settingsShared';
import { tableHead } from './settingsUtils';

const TARGET_TYPES = [
  { value: '', label: 'Any record' },
  { value: 'User', label: 'Users' },
  { value: 'Role', label: 'Roles' },
  { value: 'CompanySettings', label: 'Company settings' },
  { value: 'Employee', label: 'Employees' },
  { value: 'SalaryStructure', label: 'Salary structures' },
  { value: 'TaxDefinition', label: 'Tax definitions' },
  { value: 'AttendanceRecord', label: 'Attendance records' },
  { value: 'Candidate', label: 'Candidates' },
];

const tabStyle = (active) => ({
  padding: '8px 16px',
  fontSize: '0.82rem',
  fontWeight: active ? 700 : 500,
  color: active ? '#FFFFFF' : '#475569',
  backgroundColor: active ? '#1D4ED8' : '#F1F5F9',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
});

const AUDIT_GRID = '1.2fr 1.4fr 1.1fr 1.1fr';
const ACTIVITY_GRID = '1.2fr 2.4fr 1.2fr 1.2fr';

function ChangeDetails({ entry }) {
  const keys = [...new Set([...Object.keys(entry.before || {}), ...Object.keys(entry.after || {})])];
  if (keys.length === 0) return <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>No field values were recorded.</span>;
  const show = (v) => (v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {keys.map((key) => (
        <div key={key} style={{ fontSize: '0.78rem', color: '#334155', wordBreak: 'break-word' }}>
          <strong>{key}</strong>: <span style={{ color: '#94A3B8' }}>{show(entry.before?.[key])}</span> → {show(entry.after?.[key])}
        </div>
      ))}
    </div>
  );
}

function AuditLogView() {
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState('');
  const debouncedAction = useDebounce(action.trim(), 400);

  const params = { page, limit: 20, ...(debouncedAction ? { action: debouncedAction } : {}), ...(targetType ? { targetType } : {}), ...(from ? { from } : {}), ...(to ? { to: `${to}T23:59:59.999Z` } : {}) };
  const api = useApi(() => auditService.list(params), [params]);
  const rows = api.data?.data || [];
  const meta = api.data?.meta;
  const reset = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <SectionCard title="Audit Trail" subtitle="Who changed what, with the values before and after. Entries cannot be edited or deleted.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
        <FormField label="Action"><Input value={action} onChange={reset(setAction)} placeholder="e.g. user.status.suspended" /></FormField>
        <FormField label="Record"><Select value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(1); }} options={TARGET_TYPES} /></FormField>
        <FormField label="From"><Input type="date" value={from} onChange={reset(setFrom)} /></FormField>
        <FormField label="To"><Input type="date" value={to} onChange={reset(setTo)} /></FormField>
      </div>
      <ErrorBanner message={api.error} onRetry={api.reload} />
      <div style={{ display: 'grid', gridTemplateColumns: AUDIT_GRID, gap: 10, borderBottom: '1px solid #E2E8F0' }}>
        {['Date & Time', 'Action', 'Record', 'Changed By'].map((h) => <span key={h} style={tableHead}>{h}</span>)}
      </div>
      {api.loading && !api.data && <div style={{ paddingTop: 12 }}><PanelSkeleton rows={5} /></div>}
      {!api.loading && !api.error && rows.length === 0 && <EmptyState>No audit entries match these filters.</EmptyState>}
      <div style={{ opacity: api.loading && api.data ? 0.6 : 1 }}>
        {rows.map((entry) => (
          <div key={entry._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div
              onClick={() => setOpenId(openId === entry._id ? '' : entry._id)}
              style={{ display: 'grid', gridTemplateColumns: AUDIT_GRID, gap: 10, padding: '11px 0', fontSize: '0.82rem', color: '#0F172A', cursor: 'pointer' }}
            >
              <span style={{ color: '#475569' }}>{formatDateTime(entry.at)}</span>
              <span style={{ fontWeight: 600 }}>{auditActionLabel(entry.action)}</span>
              <span>{entry.targetType}{entry.targetId ? ` …${String(entry.targetId).slice(-6)}` : ''}</span>
              <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{entry.actorName || 'System'}</span>
            </div>
            {openId === entry._id && (
              <div style={{ padding: '4px 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ChangeDetails entry={entry} />
                {(entry.ip || entry.userAgent) && <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>From {entry.ip || 'unknown address'}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <Pagination currentPage={meta?.page || page} totalPages={meta?.totalPages || 1} onPageChange={setPage} />
      </div>
    </SectionCard>
  );
}

function ActivityView() {
  const [page, setPage] = useState(1);
  const api = useApi(() => auditService.activity({ page, limit: 20 }), [page]);
  const rows = api.data?.data || [];
  const meta = api.data?.meta;

  return (
    <SectionCard title="Activity Feed" subtitle="Every workflow step taken across the modules, newest first">
      <ErrorBanner message={api.error} onRetry={api.reload} />
      <div style={{ display: 'grid', gridTemplateColumns: ACTIVITY_GRID, gap: 10, borderBottom: '1px solid #E2E8F0' }}>
        {['Date & Time', 'Event', 'Record', 'Status Change'].map((h) => <span key={h} style={tableHead}>{h}</span>)}
      </div>
      {api.loading && !api.data && <div style={{ paddingTop: 12 }}><PanelSkeleton rows={5} /></div>}
      {!api.loading && !api.error && rows.length === 0 && <EmptyState>No activity recorded yet.</EmptyState>}
      <div style={{ opacity: api.loading && api.data ? 0.6 : 1 }}>
        {rows.map((event) => (
          <div key={event._id} style={{ display: 'grid', gridTemplateColumns: ACTIVITY_GRID, gap: 10, padding: '11px 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.82rem', color: '#0F172A' }}>
            <span style={{ color: '#475569' }}>{formatDateTime(event.occurredAt)}</span>
            <span>{event.label}{event.reason ? <span style={{ display: 'block', color: '#64748B', fontSize: '0.75rem' }}>Reason: {event.reason}</span> : null}</span>
            <span>{event.subjectRef || event.subjectType}</span>
            <span style={{ color: '#64748B' }}>{event.fromStatus || event.toStatus ? `${event.fromStatus || '—'} → ${event.toStatus || '—'}` : '—'}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <Pagination currentPage={meta?.page || page} totalPages={meta?.totalPages || 1} onPageChange={setPage} />
      </div>
    </SectionCard>
  );
}

export default function AuditTab() {
  const [view, setView] = useState('audit');
  return (
    <div>
      <PanelHeader title="Audit Log" subtitle="The record of changes and workflow activity across the system" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={tabStyle(view === 'audit')} onClick={() => setView('audit')}>Audit Trail</button>
        <button style={tabStyle(view === 'activity')} onClick={() => setView('activity')}>Activity Feed</button>
      </div>
      {view === 'audit' ? <AuditLogView /> : <ActivityView />}
    </div>
  );
}
