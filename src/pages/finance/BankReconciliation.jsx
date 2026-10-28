import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiEye, FiEdit2, FiPlay, FiSend, FiFileText, FiClock, FiCheckCircle, FiBarChart2, FiRefreshCw, FiCheck } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';
import { apiError } from '../../services/apiHelpers';
import { bankReconciliationService } from '../../services/finance.service';
import { reconciliationsSlice } from '../../store/finance/slices';
import {
  Choice, ConfirmModal, DataState, Field, FilterDrawer, FormBody, FormError, ListToolbar, Note, PageHeader, PrimaryButton, SecondaryButton,
  SimpleTable, StatTiles, StatusBadge, TabBar, TwoCol,
} from './shared/FinanceUi';
import { AttachField } from './shared/FinanceRecordExtras';
import RecordDrawer from './shared/RecordDrawer';
import {
  countFilters, csvMoney, exportRowsCsv, fieldErrorsOf, formatDate, fromKobo, money, statValue, statusLabel, toKobo, uploadStagedFiles, ymd,
} from './shared/financeUtils';
import { useAccountOptions } from './shared/useRefOptions';
import { useFinanceList, useRunAction } from './shared/useFinanceList';
import { useActionDialog } from './shared/useActionDialog';

const STATUSES = ['in_progress', 'reconciled', 'reviewed'];
const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const refId = (v) => (v && typeof v === 'object' ? v._id : v) || '';
const isLinked = (r) => Boolean(r.account && r.periodStart && r.periodEnd);

/** True when the text is a month the server can turn into period dates ("June 2026", "2026-06", "06/2026"). */
function isMonthPeriod(text) {
  const t = String(text || '').trim().toLowerCase();
  let m = /^([a-z]{3,9})\.?\s+(\d{4})$/.exec(t);
  if (m) return MONTHS.includes(m[1].slice(0, 3));
  m = /^(\d{4})-(\d{1,2})$/.exec(t) || /^(\d{1,2})\/(\d{4})$/.exec(t);
  if (!m) return false;
  const month = t.includes('/') ? Number(m[1]) : Number(m[2]);
  return month >= 1 && month <= 12;
}

function SignedMoneyInput({ value, onChange, error, placeholder = '0.00' }) {
  return (
    <Input
      value={value}
      inputMode="decimal"
      error={Boolean(error)}
      placeholder={placeholder}
      onChange={(e) => {
        const next = e.target.value.replace(/,/g, '');
        if (next === '' || /^-?\d*\.?\d{0,2}$/.test(next)) onChange(next);
      }}
    />
  );
}

const varianceColor = (variance) => (variance ? '#EA580C' : '#16A34A');

function StatementFormModal({ record, onClose, onSaved }) {
  const editing = Boolean(record);
  const run = useRunAction(reconciliationsSlice);
  const accounts = useAccountOptions({ category: 'Asset' });
  const [form, setForm] = useState(() => (editing ? {
    account: refId(record.account), statementPeriod: record.statementPeriod, currency: record.currency || 'NGN', openingBalance: fromKobo(record.openingBalance),
    closingBalance: fromKobo(record.closingBalance), remarks: record.remarks || '', periodStart: ymd(record.periodStart), periodEnd: ymd(record.periodEnd),
  } : { account: '', statementPeriod: '', currency: 'NGN', openingBalance: '', closingBalance: '', remarks: '', periodStart: '', periodEnd: '' }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const needsDates = form.statementPeriod.trim() !== '' && !isMonthPeriod(form.statementPeriod);
  const accountOptions = useMemo(() => {
    const list = accounts.options;
    if (editing && record.account && !list.some((o) => o.value === refId(record.account))) {
      return [...list, { value: refId(record.account), label: `${record.account.accountCode} – ${record.account.accountName}`, accountName: record.account.accountName }];
    }
    return list;
  }, [accounts.options, editing, record]);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    const opening = toKobo(form.openingBalance);
    const closing = toKobo(form.closingBalance);
    if (!form.account) next.account = 'Select the bank account';
    if (!form.statementPeriod.trim()) next.statementPeriod = 'Enter the statement period, e.g. June 2026';
    if (Number.isNaN(opening)) next.openingBalance = 'Enter the opening balance';
    if (Number.isNaN(closing)) next.closingBalance = 'Enter the closing balance';
    if (!form.remarks.trim()) next.remarks = 'Add a short remark about this statement';
    if (needsDates && !form.periodStart) next.periodStart = 'Choose the first day of the statement';
    if (needsDates && !form.periodEnd) next.periodEnd = 'Choose the last day of the statement';
    if (needsDates && form.periodStart && form.periodEnd && form.periodStart > form.periodEnd) next.periodEnd = 'Must be on or after the start date';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    const picked = accountOptions.find((o) => o.value === form.account);
    const body = {
      bankAccount: picked?.accountName || picked?.label || '', statementPeriod: form.statementPeriod.trim(), currency: form.currency,
      openingBalance: opening, closingBalance: closing, remarks: form.remarks.trim(),
    };
    if (needsDates) {
      body.periodStart = form.periodStart;
      body.periodEnd = form.periodEnd;
    }
    let payload = { ...body, account: form.account };
    if (editing) {
      payload = { ...body };
      const periodChanged = body.statementPeriod !== record.statementPeriod || (needsDates && (form.periodStart !== ymd(record.periodStart) || form.periodEnd !== ymd(record.periodEnd)));
      if (form.account !== refId(record.account)) payload.account = form.account;
      if (!periodChanged) {
        delete payload.statementPeriod;
        delete payload.periodStart;
        delete payload.periodEnd;
      }
    }
    setBusy(true);
    const result = editing ? await run('update', record._id, payload) : await run('create', payload);
    if (!result.ok) {
      setBusy(false);
      const fields = fieldErrorsOf(result.payload);
      if (fields.bankAccount && !fields.account) fields.account = fields.bankAccount;
      setErrors(fields);
      setFormError(result.error);
      return;
    }
    let failed = [];
    if (files.length && result.data?._id) failed = await uploadStagedFiles(bankReconciliationService, result.data._id, files);
    setBusy(false);
    onSaved(editing ? 'Statement details updated' : `${result.data?.reconciliationId || 'Statement'} imported`, failed);
  };

  return (
    <Drawer isOpen onClose={onClose}
      title={editing ? `Edit Statement ${record.reconciliationId}` : 'Import Bank Statement'}
      subtitle={editing ? 'Changing the account or period clears the matches made so far' : 'Import a bank statement to begin reconciliation'}
      width="640px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Import Statement'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={submit}>
        <TwoCol>
          <Field label="Reconciliation ID"><Input value={editing ? record.reconciliationId : 'Assigned on import'} disabled /></Field>
          <Field label="Bank account" required error={errors.account}>
            <Choice value={form.account} onChange={(v) => set('account', v)} options={accountOptions} searchable placeholder={accounts.loading ? 'Loading accounts…' : 'Select bank account'} error={errors.account} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Statement period" required error={errors.statementPeriod}>
            <Input value={form.statementPeriod} onChange={(e) => set('statementPeriod', e.target.value)} placeholder="e.g. June 2026" error={Boolean(errors.statementPeriod)} />
          </Field>
          <Field label="Currency" required error={errors.currency}><Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} /></Field>
        </TwoCol>
        {needsDates && (
          <TwoCol>
            <Field label="Statement starts" required error={errors.periodStart} help="Needed to find the ledger transactions to match."><DatePicker value={form.periodStart} onChange={(e) => set('periodStart', e.target.value)} error={Boolean(errors.periodStart)} /></Field>
            <Field label="Statement ends" required error={errors.periodEnd}><DatePicker value={form.periodEnd} onChange={(e) => set('periodEnd', e.target.value)} error={Boolean(errors.periodEnd)} /></Field>
          </TwoCol>
        )}
        <TwoCol>
          <Field label="Opening balance" required error={errors.openingBalance}><SignedMoneyInput value={form.openingBalance} onChange={(v) => set('openingBalance', v)} error={errors.openingBalance} /></Field>
          <Field label="Closing balance" required error={errors.closingBalance}><SignedMoneyInput value={form.closingBalance} onChange={(v) => set('closingBalance', v)} error={errors.closingBalance} /></Field>
        </TwoCol>
        <Field label="Remarks" required error={errors.remarks}>
          <Textarea rows={4} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="June 2026 bank statement imported for reconciliation." error={Boolean(errors.remarks)} />
        </Field>
        {!editing && <Field label="Attach documents (optional)" help="Attach the bank statement file (PDF, CSV or XLSX) so reviewers can compare it."><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
      </FormBody>
    </Drawer>
  );
}

function MatchModal({ record, canMatch, canDecide, onClose, onChanged }) {
  const [current, setCurrent] = useState(record);
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState({ key: null, lines: [], truncated: false, error: '' });
  const [picked, setPicked] = useState([]);
  const [view, setView] = useState('unmatched');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editable = canMatch && current.status === 'in_progress';

  useEffect(() => {
    let cancelled = false;
    bankReconciliationService.ledgerLines(record._id)
      .then((res) => { if (!cancelled) setLoaded({ key: reloadKey, lines: res.data?.data?.lines || [], truncated: Boolean(res.data?.data?.truncated), error: '' }); })
      .catch((err) => { if (!cancelled) setLoaded({ key: reloadKey, lines: [], truncated: false, error: apiError(err, 'Could not load the ledger transactions') }); });
    return () => { cancelled = true; };
  }, [record._id, reloadKey]);

  const loading = loaded.key !== reloadKey;
  const matchedLines = loaded.lines.filter((l) => l.matched);
  const unmatchedLines = loaded.lines.filter((l) => !l.matched);
  const shown = view === 'matched' ? matchedLines : view === 'unmatched' ? unmatchedLines : loaded.lines;
  const allShownPicked = shown.length > 0 && shown.every((l) => picked.includes(l._id));

  const apply = async (request) => {
    setBusy(true);
    setError('');
    try {
      const res = await request();
      const doc = res.data?.data;
      if (doc) setCurrent((c) => ({ ...c, matchedCount: doc.matchedCount, totalCount: doc.totalCount, variance: doc.variance, status: doc.status }));
      setPicked([]);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(apiError(err, 'The update failed'));
    }
    setBusy(false);
  };

  const matchPicked = (matched) => apply(() => bankReconciliationService.match(record._id, picked, matched));
  const matchOne = (line) => apply(() => bankReconciliationService.match(record._id, [line._id], !line.matched));
  const autoMatch = () => apply(() => bankReconciliationService.autoMatch(record._id));

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      await bankReconciliationService.markReconciled(record._id);
      setBusy(false);
      onChanged(`${record.reconciliationId} marked as reconciled`);
    } catch (err) {
      setBusy(false);
      setError(apiError(err, 'Could not mark the statement as reconciled'));
    }
  };

  const open = Math.max(0, current.totalCount - current.matchedCount);
  const columns = [
    ...(editable ? [{
      key: 'pick', label: '',
      render: (r) => <input type="checkbox" aria-label="Select transaction" checked={picked.includes(r._id)} onChange={() => setPicked((p) => (p.includes(r._id) ? p.filter((id) => id !== r._id) : [...p, r._id]))} style={{ accentColor: '#1D4ED8' }} />,
    }] : []),
    { key: 'postingDate', label: 'Date', render: (r) => formatDate(r.postingDate) },
    { key: 'entryRef', label: 'Reference' },
    { key: 'narration', label: 'Narration', render: (r) => r.narration || '—' },
    { key: 'debit', label: 'Debit', align: 'right', render: (r) => (r.debit ? money(r.debit) : '—') },
    { key: 'credit', label: 'Credit', align: 'right', render: (r) => (r.credit ? money(r.credit) : '—') },
    { key: 'matched', label: 'Status', render: (r) => <StatusBadge status={r.matched ? 'reconciled' : 'pending'} label={r.matched ? 'Matched' : 'Unmatched'} /> },
    ...(editable ? [{
      key: 'act', label: '', align: 'right',
      render: (r) => <SecondaryButton disabled={busy} onClick={() => matchOne(r)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>{r.matched ? 'Unmatch' : 'Match'}</SecondaryButton>,
    }] : []),
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${editable ? 'Reconcile' : 'Transactions'}: ${current.bankAccount}`}
      subtitle={`${record.reconciliationId} · ${record.statementPeriod}`}
      maxWidth="900px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Close</SecondaryButton>
          {canDecide && current.status === 'in_progress' && (
            <PrimaryButton icon={<FiCheck size={14} />} onClick={finish} disabled={busy || loading || open > 0}>Mark as Reconciled</PrimaryButton>
          )}
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#EFF6FF', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: '0.813rem', color: '#1E40AF' }}>
            <strong>{current.matchedCount} / {current.totalCount}</strong> transactions matched · Unmatched value: <strong style={{ color: varianceColor(current.variance) }}>{money(current.variance)}</strong>
          </span>
          {editable && (
            <PrimaryButton icon={<FiRefreshCw size={12} />} onClick={autoMatch} disabled={busy || loading || open === 0} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Auto-Match All</PrimaryButton>
          )}
        </div>
        {current.currency && current.currency !== 'NGN' && <Note>Ledger amounts are shown in the base currency (NGN).</Note>}
        {!loading && !loaded.error && (
          <TabBar
            tabs={[
              { id: 'unmatched', label: `Unmatched (${unmatchedLines.length})` },
              { id: 'matched', label: `Matched (${matchedLines.length})` },
              { id: 'all', label: `All (${loaded.lines.length})` },
            ]}
            active={view}
            onChange={(v) => { setView(v); setPicked([]); }}
          />
        )}
        {editable && picked.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#475569' }}>{picked.length} selected</span>
            <PrimaryButton onClick={() => matchPicked(true)} disabled={busy} style={{ padding: '5px 12px', fontSize: '0.75rem' }}>Match Selected</PrimaryButton>
            <SecondaryButton onClick={() => matchPicked(false)} disabled={busy} style={{ padding: '5px 12px', fontSize: '0.75rem' }}>Unmatch Selected</SecondaryButton>
          </div>
        )}
        {editable && shown.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={allShownPicked} onChange={() => setPicked(allShownPicked ? [] : shown.map((l) => l._id))} style={{ accentColor: '#1D4ED8' }} />
            Select all listed transactions
          </label>
        )}
        <DataState loading={loading} error={loaded.error} empty={false} onRetry={() => setReloadKey((k) => k + 1)}>
          {open === 0 && view === 'unmatched' && loaded.lines.length > 0 ? (
            <div style={{ padding: 24, textAlign: 'center', background: '#F8FAFC', borderRadius: 8, color: '#16A34A', fontWeight: 600, fontSize: '0.813rem' }}>
              All transactions matched. Zero ledger-statement variance.
            </div>
          ) : (
            <SimpleTable columns={columns} rows={shown} empty={loaded.lines.length === 0 ? 'No ledger transactions were posted to this bank account in the statement period.' : 'No transactions in this view.'} />
          )}
        </DataState>
        {loaded.truncated && <Note tone="amber">Only the first 1,000 transactions of the period are listed.</Note>}
        <FormError message={error} />
      </div>
    </Modal>
  );
}

export default function BankReconciliation() {
  const { toast, showToast, hideToast } = useToast();
  const canView = usePermission('finance.bankreconciliation.view');
  const canCreate = usePermission('finance.bankreconciliation.create');
  const canUpdate = usePermission('finance.bankreconciliation.update');
  const canDecide = usePermission('finance.bankreconciliation.decide');
  const list = useFinanceList(reconciliationsSlice, { initialFilters: { status: '', bankAccount: '' }, enabled: canView });
  const run = useRunAction(reconciliationsSlice);
  const accounts = useAccountOptions({ category: 'Asset', activeOnly: false });
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [matchFor, setMatchFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [localKey, setLocalKey] = useState(0);
  const { reload } = list;

  const refreshAll = (message) => {
    reload();
    setLocalKey((k) => k + 1);
    if (message) showToast(message, 'success');
  };
  const dlg = useActionDialog(run, (message) => refreshAll(message));

  const afterSave = (message, failedUploads) => {
    setFormFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, 'success');
  };

  const bankAccountOptions = useMemo(() => {
    const seen = new Set();
    return accounts.options
      .filter((o) => (seen.has(o.accountName) ? false : seen.add(o.accountName)))
      .map((o) => ({ value: o.accountName, label: o.accountName }));
  }, [accounts.options]);

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'bank-reconciliations.csv',
        fetchPage: (n) => bankReconciliationService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Reconciliation ID', value: (r) => r.reconciliationId },
          { label: 'Bank Account', value: (r) => r.bankAccount },
          { label: 'Statement Period', value: (r) => r.statementPeriod },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Opening Balance', value: (r) => csvMoney(r.openingBalance) },
          { label: 'Closing Balance', value: (r) => csvMoney(r.closingBalance) },
          { label: 'Matched Transactions', value: (r) => `${r.matchedCount} / ${r.totalCount}` },
          { label: 'Variance', value: (r) => csvMoney(r.variance) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} statement${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const actionsFor = (r) => {
    const items = [];
    if (r.status === 'in_progress' && (canUpdate || canDecide)) items.push({ key: 'continue', label: 'Continue Reconciliation', icon: <FiPlay size={14} /> });
    if (r.status === 'in_progress' && canUpdate) items.push({ key: 'edit', label: 'Edit Statement', icon: <FiEdit2 size={14} /> });
    if (r.status === 'reconciled' && canDecide) items.push({ key: 'review', label: 'Submit for Review', icon: <FiSend size={14} />, color: '#16A34A' });
    return items;
  };

  const trigger = (key, r) => {
    if (key === 'continue') setMatchFor(r);
    else if (key === 'edit') setFormFor(r);
    else dlg.open(key, r);
  };

  const columns = [
    { key: 'reconciliationId', label: 'RECONCILIATION ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'bankAccount', label: 'BANK ACCOUNT', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'statementPeriod', label: 'STATEMENT PERIOD' },
    { key: 'openingBalance', label: 'OPENING BALANCE', render: (v, row) => money(v, row.currency) },
    { key: 'closingBalance', label: 'CLOSING BALANCE', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'matchedCount', label: 'MATCHED TRANSACTIONS', render: (_, row) => `${row.matchedCount} / ${row.totalCount}` },
    { key: 'variance', label: 'VARIANCE', render: (v, row) => <span style={{ fontWeight: 600, color: varianceColor(v) }}>{money(v, row.currency)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = actionsFor(row).filter((a) => a.key !== 'edit').map((a) => ({ label: a.label, icon: a.icon, color: a.color, action: () => trigger(a.key, row) }));
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View statement" aria-label="View statement"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  const describe = (r) => ({
    title: `${r.reconciliationId} – ${r.bankAccount}`,
    subtitle: 'Statement period variance summary',
    status: r.status,
    actions: actionsFor(r).map((a) => <SecondaryButton key={a.key} icon={a.icon} onClick={() => trigger(a.key, r)}>{a.label}</SecondaryButton>),
    notes: [!isLinked(r) && { tone: 'amber', text: 'This statement is not linked to a ledger bank account and period dates, so its transactions cannot be matched.' }],
    items: [
      ['Reconciliation ID', r.reconciliationId], ['Bank account', r.bankAccount],
      ['Ledger account', r.account ? `${r.account.accountCode} – ${r.account.accountName}` : '—'], ['Statement period', r.statementPeriod],
      ['Period dates', r.periodStart && r.periodEnd ? `${formatDate(r.periodStart)} – ${formatDate(r.periodEnd)}` : '—'], ['Currency', r.currency],
      ['Opening balance', money(r.openingBalance, r.currency)], ['Closing balance', money(r.closingBalance, r.currency)],
      ['Matched transactions', `${r.matchedCount} / ${r.totalCount}`],
      ['Variance', <span key="v" style={{ fontWeight: 600, color: varianceColor(r.variance) }}>{money(r.variance, r.currency)}</span>],
      ['Status', statusLabel(r.status)],
    ],
    panels: [{ title: 'Remarks', text: r.remarks, empty: 'No remarks recorded.' }],
    canEditDocs: r.status === 'in_progress' && canUpdate,
  });

  const reconciledTotal = statValue(list.stats, 'reconciled') + statValue(list.stats, 'reviewed');
  const tiles = [
    { label: 'Total statements', value: statValue(list.stats, 'total_statements'), sub: 'Statements imported', icon: <FiFileText size={15} />, tone: 'green' },
    { label: 'In progress', value: statValue(list.stats, 'in_progress'), sub: 'Awaiting reconciliation', icon: <FiClock size={15} />, tone: 'amber' },
    { label: 'Reconciled', value: reconciledTotal, sub: 'Successfully matched (incl. reviewed)', icon: <FiCheckCircle size={15} />, tone: 'red' },
    { label: 'Outstanding variance', value: money(statValue(list.stats, 'outstanding_variance')), sub: 'Unmatched transaction value (NGN)', icon: <FiBarChart2 size={15} />, tone: 'blue' },
  ];

  if (!canView) return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view bank reconciliations.</div>;

  const d = dlg.dialog;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Bank Reconciliation" subtitle="Match bank statements with recorded transactions to ensure financial accuracy" />
      <StatTiles tiles={tiles} loading={list.statsLoading && list.stats.length === 0} error={Boolean(list.statsError)} />

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search reconciliation ID, bank account, period…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
          {canCreate && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Import Bank Statement</PrimaryButton>}
        </ListToolbar>
        <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No bank statements found." onRetry={list.reload}>
          <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No bank statements found." />
        </DataState>
        <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      </div>

      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Statements" subtitle="Filter by status and bank account"
        fields={[
          { key: 'status', label: 'Status', options: STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' },
          { key: 'bankAccount', label: 'Bank account', options: bankAccountOptions, allLabel: 'All bank accounts' },
        ]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && <RecordDrawer api={bankReconciliationService} id={viewId} refreshKey={localKey} onClose={() => setViewId(null)} describe={describe} detailsLabel="Statement Details" width="520px" />}
      {formFor && <StatementFormModal record={formFor === 'new' ? null : formFor} onClose={() => setFormFor(null)} onSaved={afterSave} />}
      {matchFor && (
        <MatchModal
          record={matchFor} canMatch={canUpdate} canDecide={canDecide}
          onClose={() => { setMatchFor(null); refreshAll(); }}
          onChanged={(message) => { setMatchFor(null); refreshAll(message); }}
        />
      )}
      {d?.kind === 'review' && (
        <ConfirmModal
          title="Submit for review?" message="The reconciled statement is locked and sent for review." detail={`${d.record.reconciliationId} – ${d.record.bankAccount} (${d.record.statementPeriod})`}
          confirmLabel="Submit for Review" busy={dlg.busy} error={dlg.error} onClose={dlg.close}
          onConfirm={() => dlg.exec('submitReview', d.record, `${d.record.reconciliationId} submitted for review`)}
        />
      )}
    </div>
  );
}
