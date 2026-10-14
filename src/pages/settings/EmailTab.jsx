import { useState } from 'react';
import { FormField, Input, Select } from '../../components/ui/FormField';
import Pagination from '../../components/ui/Pagination';
import { mailOutboxService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermission } from '../../hooks/usePermission';
import { formatDateTime } from '../users/auditFormat';
import { EmptyState, ErrorBanner, LinkButton, NoticeBanner, PanelHeader, PanelSkeleton, SectionCard } from './settingsShared';
import { tableHead } from './settingsUtils';

const STATUSES = [
  { value: '', label: 'Every status' },
  { value: 'pending', label: 'Pending' },
  { value: 'sending', label: 'Sending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'dead', label: 'Gave up after retries' },
  { value: 'skipped', label: 'Skipped' },
];
const COLORS = { pending: '#CA8A04', sending: '#1D4ED8', sent: '#16A34A', failed: '#DC2626', dead: '#DC2626', skipped: '#64748B' };
const GRID = '1.1fr 1.6fr 2fr 0.9fr 0.5fr 0.7fr';
const PRIORITY = ['P0', 'P1', 'P2'];

function StatTile({ label, value, tone }) {
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px', backgroundColor: '#FFFFFF' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#64748B' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: tone || '#0F172A', marginTop: 2 }}>{value ?? '—'}</div>
    </div>
  );
}

export default function EmailTab({ showToast }) {
  const canRetry = usePermission('core.settings.update');
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState('');
  const [openId, setOpenId] = useState('');
  const [actionError, setActionError] = useState('');
  const debouncedEmail = useDebounce(email.trim(), 400);

  const stats = useApi(() => mailOutboxService.stats(), []);
  const list = useApi(
    () => mailOutboxService.list({ page, limit: 15, ...(status ? { status } : {}), ...(debouncedEmail ? { email: debouncedEmail } : {}) }),
    [status, debouncedEmail, page],
  );
  const rows = list.data?.data || [];
  const meta = list.data?.meta;
  const s = stats.data?.data;

  const retry = async (id) => {
    setBusyId(id);
    setActionError('');
    try {
      await mailOutboxService.retry(id);
      showToast('Email queued for another attempt', 'success');
      list.reload();
      stats.reload();
    } catch (err) {
      setActionError(apiError(err, 'Could not retry this email'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <PanelHeader title="Email Outbox" subtitle="Delivery status of every email the system sends. Message bodies are never shown here." />
      <ErrorBanner message={stats.error} onRetry={stats.reload} />
      {s && (s.dead > 0 || s.failed > 0) && (
        <NoticeBanner tone="warn">
          {s.dead + s.failed} email{s.dead + s.failed === 1 ? '' : 's'} could not be delivered. Check the sender settings with your IT contact, then retry them below.
        </NoticeBanner>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatTile label="Pending" value={s?.pending} tone="#CA8A04" />
        <StatTile label="Sending" value={s?.sending} />
        <StatTile label="Sent" value={s?.sent} tone="#16A34A" />
        <StatTile label="Failed" value={s?.failed} tone="#DC2626" />
        <StatTile label="Gave up" value={s?.dead} tone="#DC2626" />
        <StatTile label="Skipped" value={s?.skipped} />
      </div>
      {s?.oldestPendingAt && <p style={{ margin: '-8px 0 16px', fontSize: '0.78rem', color: '#64748B' }}>Oldest pending email queued {formatDateTime(s.oldestPendingAt)}.</p>}

      <SectionCard title="Messages">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          <FormField label="Status"><Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUSES} /></FormField>
          <FormField label="Recipient"><Input value={email} onChange={(e) => { setEmail(e.target.value); setPage(1); }} placeholder="exact email address" /></FormField>
        </div>
        <ErrorBanner message={actionError || list.error} onRetry={list.error ? list.reload : undefined} />
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, borderBottom: '1px solid #E2E8F0' }}>
          {['Queued', 'Recipient', 'Subject', 'Status', 'Tries', ''].map((h) => <span key={h} style={tableHead}>{h}</span>)}
        </div>
        {list.loading && !list.data && <div style={{ paddingTop: 12 }}><PanelSkeleton rows={5} /></div>}
        {!list.loading && !list.error && rows.length === 0 && <EmptyState>No emails match these filters.</EmptyState>}
        <div style={{ opacity: list.loading && list.data ? 0.6 : 1 }}>
          {rows.map((row) => (
            <div key={row._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <div onClick={() => setOpenId(openId === row._id ? '' : row._id)} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '11px 0', fontSize: '0.8rem', color: '#0F172A', cursor: 'pointer', alignItems: 'start' }}>
                <span style={{ color: '#475569' }}>{formatDateTime(row.createdAt)}</span>
                <span style={{ wordBreak: 'break-all' }}>{row.to?.email}<br /><span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>{row.eventKey} · {PRIORITY[row.priority] || ''}</span></span>
                <span style={{ wordBreak: 'break-word' }}>{row.subject}</span>
                <span style={{ color: COLORS[row.status], fontWeight: 600 }}>{STATUSES.find((o) => o.value === row.status)?.label || row.status}</span>
                <span>{row.attempts}/{row.maxAttempts}</span>
                <span onClick={(e) => e.stopPropagation()}>
                  {canRetry && ['failed', 'dead'].includes(row.status) && (
                    <LinkButton onClick={() => retry(row._id)} disabled={busyId === row._id}>{busyId === row._id ? 'Retrying...' : 'Retry'}</LinkButton>
                  )}
                </span>
              </div>
              {openId === row._id && (
                <div style={{ padding: '2px 0 12px', fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
                  {row.lastError && <div><strong>Last error:</strong> {row.lastError}</div>}
                  {(row.attemptLog || []).map((a, i) => <div key={i} style={{ color: '#64748B' }}>{formatDateTime(a.at)}{a.code ? ` · ${a.code}` : ''} · {a.message}</div>)}
                  {!row.lastError && !(row.attemptLog || []).length && <div style={{ color: '#94A3B8' }}>No delivery problems recorded.</div>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Pagination currentPage={meta?.page || page} totalPages={meta?.totalPages || 1} onPageChange={setPage} />
        </div>
      </SectionCard>
    </div>
  );
}
