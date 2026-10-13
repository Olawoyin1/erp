import { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { Input } from '../../components/ui/FormField';
import { settingsService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import Loaded from './Loaded';
import LedgerSettings from './LedgerSettings';
import PostingQueue from './PostingQueue';
import { ErrorBanner, FooterButtons, NoticeBanner, PanelHeader, SectionCard } from './settingsShared';
import { detailErrors } from './settingsUtils';

const CATEGORY_LABELS = { Asset: 'Assets', Liability: 'Liabilities', Equity: 'Equity', Revenue: 'Revenue', Expense: 'Expenses' };

function rangesOverlap(ranges) {
  const sorted = [...ranges].sort((a, b) => a.rangeStart - b.rangeStart);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].rangeStart <= sorted[i - 1].rangeEnd) return `${CATEGORY_LABELS[sorted[i - 1].category]} and ${CATEGORY_LABELS[sorted[i].category]} overlap`;
  }
  return '';
}

function RangesForm({ ranges, canEdit, showToast }) {
  const toRows = (list) => list.map((r) => ({ category: r.category, start: String(r.rangeStart), end: String(r.rangeEnd) }));
  const [rows, setRows] = useState(() => toRows(ranges));
  const [saved, setSaved] = useState(() => toRows(ranges));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (index, field, value) => {
    setRows((p) => p.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    setErrors({});
    setFormError('');
  };

  const dirty = JSON.stringify(rows) !== JSON.stringify(saved);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const payload = rows.map((r, i) => {
      const start = Number(r.start);
      const end = Number(r.end);
      if (!/^\d+$/.test(r.start) || !/^\d+$/.test(r.end)) errs[i] = 'Use whole numbers';
      else if (start > end) errs[i] = 'Range start must not be above range end';
      return { category: r.category, rangeStart: start, rangeEnd: end };
    });
    if (Object.keys(errs).length === 0) {
      const overlap = rangesOverlap(payload);
      if (overlap) errs.form = overlap;
    }
    if (Object.keys(errs).length) { setErrors(errs); setFormError(errs.form || ''); return; }

    setSaving(true);
    try {
      await settingsService.updateFinanceConfiguration({ chartOfAccountsRanges: payload });
      setSaved(rows);
      showToast('Chart of accounts ranges saved', 'success');
    } catch (err) {
      setErrors(detailErrors(err));
      setFormError(apiError(err, 'Could not save the ranges'));
    } finally {
      setSaving(false);
    }
  };

  const head = { fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.4px' };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SectionCard title="Chart of Accounts — Number Ranges" subtitle="A new ledger account must have a code inside the range of its category. Ranges must not overlap.">
        <ErrorBanner message={formError} />
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 16, padding: '8px 0', borderBottom: '1px solid #E2E8F0', marginBottom: 8 }}>
          <span style={head}>Category</span>
          <span style={head}>Range Start</span>
          <span style={head}>Range End</span>
        </div>
        {rows.map((row, i) => (
          <div key={row.category} style={{ padding: '8px 0', borderBottom: i < rows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 16, alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{CATEGORY_LABELS[row.category] || row.category}</span>
              <Input inputMode="numeric" value={row.start} onChange={(e) => update(i, 'start', e.target.value)} disabled={!canEdit} error={!!errors[i]} />
              <Input inputMode="numeric" value={row.end} onChange={(e) => update(i, 'end', e.target.value)} disabled={!canEdit} error={!!errors[i]} />
            </div>
            {errors[i] && <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 4 }}>{errors[i]}</div>}
          </div>
        ))}
        <p style={{ margin: '12px 0 0', fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
          <FiCheckCircle size={11} /> Existing accounts keep their codes; only new accounts are checked against these ranges.
        </p>
      </SectionCard>
      {canEdit && <FooterButtons onDiscard={() => { setRows(saved); setErrors({}); setFormError(''); }} saving={saving} dirty={dirty} />}
    </form>
  );
}

export default function FinanceTab({ showToast }) {
  const canViewSettings = usePermission('core.settings.view');
  const canEditSettings = usePermission('core.settings.update');
  const canViewLedger = usePermission('finance.ledger.view');
  const api = useApi(() => (canViewSettings ? settingsService.getFinanceConfiguration() : Promise.resolve({ data: { data: null } })), [canViewSettings]);

  return (
    <div>
      <PanelHeader title="Finance Configuration" subtitle="Configure chart of accounts number ranges, ledger posting, account mappings and the posting queue" />
      {canViewSettings && (
        <Loaded api={api} rows={5}>
          {(settings) =>
            settings && <RangesForm key={settings.updatedAt} ranges={settings.chartOfAccountsRanges || []} canEdit={canEditSettings} showToast={showToast} />
          }
        </Loaded>
      )}
      {canViewLedger ? (
        <>
          <LedgerSettings showToast={showToast} />
          <PostingQueue showToast={showToast} />
        </>
      ) : (
        <NoticeBanner>Ledger posting, account mappings and the posting queue need the finance ledger permission, which your role does not have.</NoticeBanner>
      )}
    </div>
  );
}
