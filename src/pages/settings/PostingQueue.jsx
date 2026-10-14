import { useState } from 'react';
import { Select } from '../../components/ui/FormField';
import Pagination from '../../components/ui/Pagination';
import { financeSettingsService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import { formatDateTime } from '../users/auditFormat';
import { EmptyState, ErrorBanner, LinkButton, PanelSkeleton, PrimaryButton, SectionCard } from './settingsShared';
import { tableHead } from './settingsUtils';

const STATUS_OPTIONS = [
  { value: '', label: 'Every status' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed_config', label: 'Waiting for configuration' },
  { value: 'dead', label: 'Failed for good' },
  { value: 'posted', label: 'Posted' },
  { value: 'skipped', label: 'Skipped' },
];
const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_COLORS = { pending: '#CA8A04', failed_config: '#EA580C', dead: '#DC2626', posted: '#16A34A', skipped: '#64748B' };
const GRID = '1.3fr 1.2fr 1fr 0.5fr 2fr 0.7fr';

/** Ledger postings that did not go through yet, with a retry per row and a "process now" button. */
export default function PostingQueue({ showToast }) {
  const canAdmin = usePermission('finance.ledger.admin');
  const [status, setStatus] = useState('failed_config');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState('');
  const [draining, setDraining] = useState(false);
  const [actionError, setActionError] = useState('');
  const api = useApi(() => financeSettingsService.postingTasks({ page, limit: 10, ...(status ? { status } : {}) }), [status, page]);

  const rows = api.data?.data || [];
  const meta = api.data?.meta;

  const retry = async (id) => {
    setBusyId(id);
    setActionError('');
    try {
      await financeSettingsService.retryPostingTask(id);
      showToast('Posting retried', 'success');
      api.reload();
    } catch (err) {
      setActionError(apiError(err, 'Retry failed'));
    } finally {
      setBusyId('');
    }
  };

  const drain = async () => {
    setDraining(true);
    setActionError('');
    try {
      const res = await financeSettingsService.drainPostingTasks();
      showToast(`Posting queue processed: ${res.data.data?.posted ?? 0} posted`, 'success');
      api.reload();
    } catch (err) {
      setActionError(apiError(err, 'Could not process the queue'));
    } finally {
      setDraining(false);
    }
  };

  return (
    <SectionCard
      title="Posting Queue"
      subtitle="Business events waiting to reach the ledger. A task waiting for configuration posts once the missing account mapping is set."
      action={canAdmin && <PrimaryButton onClick={drain} disabled={draining}>{draining ? 'Processing...' : 'Process Queue Now'}</PrimaryButton>}
    >
      <div style={{ maxWidth: 280, marginBottom: 14 }}>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUS_OPTIONS} />
      </div>
      <ErrorBanner message={actionError || api.error} onRetry={api.error ? api.reload : undefined} />

      <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, borderBottom: '1px solid #E2E8F0' }}>
        {['Event', 'Source', 'Status', 'Tries', 'Last error', ''].map((h) => <span key={h} style={tableHead}>{h}</span>)}
      </div>
      {api.loading && rows.length === 0 && !api.error && <div style={{ paddingTop: 12 }}><PanelSkeleton rows={3} /></div>}
      {!api.loading && !api.error && rows.length === 0 && <EmptyState>Nothing in the queue for this filter.</EmptyState>}
      {rows.map((task) => (
        <div key={task._id} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, alignItems: 'start', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.8rem', color: '#0F172A' }}>
          <span>{task.event}<br /><span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>{formatDateTime(task.createdAt)}</span></span>
          <span>{task.sourceType}</span>
          <span style={{ color: STATUS_COLORS[task.status], fontWeight: 600 }}>{STATUS_LABELS[task.status] || task.status}</span>
          <span>{task.attempts}</span>
          <span style={{ color: '#64748B', wordBreak: 'break-word' }}>{task.lastError || '—'}</span>
          <span>
            {canAdmin && ['failed_config', 'dead', 'pending'].includes(task.status) && (
              <LinkButton onClick={() => retry(task._id)} disabled={busyId === task._id}>{busyId === task._id ? 'Retrying...' : 'Retry'}</LinkButton>
            )}
          </span>
        </div>
      ))}
      <div style={{ marginTop: 12 }}>
        <Pagination currentPage={meta?.page || page} totalPages={meta?.totalPages || 1} onPageChange={setPage} />
      </div>
    </SectionCard>
  );
}
