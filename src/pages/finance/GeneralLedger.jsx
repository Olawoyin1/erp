import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FiPlus, FiEye, FiEdit2, FiCheck, FiX, FiRefreshCw, FiDownload, FiSend, FiBook, FiCheckCircle, FiFileText, FiLock, FiUnlock, FiUpload,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';
import { apiError, populatedName } from '../../services/apiHelpers';
import { financialStatementService, journalEntryService, ledgerService, accountService } from '../../services/finance.service';
import { accountsSlice, journalsSlice } from '../../store/finance/slices';
import ImportDialog from '../hr/ImportDialog';
import {
  Choice, ConfirmModal, DataState, DetailGrid, DrawerStatusBar, Field, FilterDrawer, FormBody, FormError, ListToolbar, MoneyInput, Note,
  PageHeader, Panel, PrimaryButton, ReasonModal, SecondaryButton, SimpleTable, StatTiles, StatusBadge, TabBar, Tag, TwoCol,
} from './shared/FinanceUi';
import { AttachField, DocumentUploads, HistoryList } from './shared/FinanceRecordExtras';
import {
  compactMoney, countFilters, csvMoney, downloadFile, exportRowsCsv, fieldErrorsOf, formatDate, money, statValue, statusLabel, toKobo, today,
  uploadStagedFiles, ymd, fromKobo,
} from './shared/financeUtils';
import { useAccountOptions, useLegalEntityOptions, useProjectOptions } from './shared/useRefOptions';
import { useFinanceList, useRunAction } from './shared/useFinanceList';
import { useRecord } from './shared/useRecord';

const CATEGORIES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
const CATEGORY_LABEL = { Asset: 'Assets', Liability: 'Liabilities', Equity: 'Equity', Revenue: 'Revenue', Expense: 'Expenses' };
const CATEGORY_TONE = { Asset: 'blue', Liability: 'amber', Equity: 'purple', Revenue: 'green', Expense: 'slate' };
const JOURNAL_STATUSES = ['draft', 'pending_approval', 'approved', 'posted', 'rejected', 'reversed'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const refId = (v) => (v && typeof v === 'object' ? v._id : v) || '';
const personName = (p) => (p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '—');
const accountText = (a) => (a && typeof a === 'object' ? `${a.accountCode} – ${a.accountName}` : '—');

/* ───────────────────────────── Accounts ───────────────────────────── */

function AccountFormModal({ account, onClose, onSaved }) {
  const editing = Boolean(account);
  const run = useRunAction(accountsSlice);
  const parents = useAccountOptions({ activeOnly: false });
  const [form, setForm] = useState(() => ({
    accountCode: editing ? String(account.accountCode) : '',
    category: editing ? account.category : 'Asset',
    accountName: editing ? account.accountName : '',
    parentAccount: editing ? refId(account.parentAccount) : '',
    description: editing ? account.description || '' : '',
    status: editing ? account.status : 'active',
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const parentChoices = parents.options.filter((p) => !editing || p._id !== account._id);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!editing && !/^[1-9]\d*$/.test(form.accountCode)) next.accountCode = 'Enter a whole number such as 5400';
    if (!form.accountName.trim()) next.accountName = 'Enter the account name';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setBusy(true);
    let result;
    if (editing) {
      const body = {};
      if (form.category !== account.category) body.category = form.category;
      if (form.accountName.trim() !== account.accountName) body.accountName = form.accountName.trim();
      if (form.parentAccount && form.parentAccount !== refId(account.parentAccount)) body.parentAccount = form.parentAccount;
      if ((form.description || '') !== (account.description || '')) body.description = form.description;
      result = Object.keys(body).length ? await run('update', account._id, body) : { ok: true };
      if (result.ok && form.status !== account.status) result = await run(form.status === 'active' ? 'activate' : 'deactivate', account._id);
    } else {
      const body = { accountCode: Number(form.accountCode), category: form.category, accountName: form.accountName.trim() };
      if (form.parentAccount) body.parentAccount = form.parentAccount;
      if (form.description.trim()) body.description = form.description.trim();
      result = await run('create', body);
    }
    setBusy(false);
    if (!result.ok) {
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    onSaved(editing ? 'Account details updated successfully' : 'New account added to the chart of accounts');
  };

  return (
    <Modal isOpen onClose={onClose} title={editing ? 'Edit Account' : 'Create Account'} subtitle="Create and manage general ledger accounts" maxWidth="600px">
      <FormBody onSubmit={submit}>
        <TwoCol>
          <Field label="Account code" required error={errors.accountCode} help={editing ? 'The code cannot be changed after creation.' : undefined}>
            <Input value={form.accountCode} onChange={(e) => set('accountCode', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 5400" disabled={editing} error={Boolean(errors.accountCode)} />
          </Field>
          <Field label="Category" required error={errors.category}>
            <Choice value={form.category} onChange={(v) => set('category', v)} options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))} />
          </Field>
        </TwoCol>
        <Field label="Account name" required error={errors.accountName}>
          <Input value={form.accountName} onChange={(e) => set('accountName', e.target.value)} placeholder="e.g. Direct Material Procurement" error={Boolean(errors.accountName)} />
        </Field>
        <TwoCol>
          <Field label="Parent account" error={errors.parentAccount}>
            <Choice value={form.parentAccount} onChange={(v) => set('parentAccount', v)} options={[{ value: '', label: 'None (top level)' }, ...parentChoices]} searchable placeholder={parents.loading ? 'Loading…' : 'Select parent'} />
          </Field>
          <Field label="Status">
            {editing ? (
              <Choice value={form.status} onChange={(v) => set('status', v)} options={[{ value: 'active', label: 'Active (ready for postings)' }, { value: 'inactive', label: 'Inactive' }]} />
            ) : (
              <Input value="Active (ready for postings)" disabled />
            )}
          </Field>
        </TwoCol>
        <Field label="Description (optional)">
          <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Records routine maintenance costs for project equipment." />
        </Field>
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Account'}</PrimaryButton>
        </div>
      </FormBody>
    </Modal>
  );
}

function RecentEntries({ accountId }) {
  const [state, setState] = useState({ id: null, rows: [], error: '' });
  useEffect(() => {
    let cancelled = false;
    ledgerService.lines({ account: accountId, page: 1, limit: 10, order: 'desc' })
      .then((res) => { if (!cancelled) setState({ id: accountId, rows: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setState({ id: accountId, rows: [], error: apiError(err, 'Could not load entries') }); });
    return () => { cancelled = true; };
  }, [accountId]);
  if (state.id !== accountId) return <DataState loading />;
  if (state.error) return <FormError message={state.error} />;
  return (
    <SimpleTable
      empty="No posted entries on this account yet."
      columns={[
        { key: 'postingDate', label: 'Date', render: (r) => formatDate(r.postingDate) },
        { key: 'entryRef', label: 'Journal ID' },
        { key: 'narration', label: 'Description', render: (r) => r.narration || '—' },
        { key: 'debit', label: 'Debit', align: 'right', render: (r) => (r.debit ? money(r.debit, r.currency) : '—') },
        { key: 'credit', label: 'Credit', align: 'right', render: (r) => (r.credit ? money(r.credit, r.currency) : '—') },
      ]}
      rows={state.rows}
    />
  );
}

function AccountDrawer({ accountId, canUpdate, refreshKey, onClose, onEdit, onToggle }) {
  const [tab, setTab] = useState('info');
  const { record: acc, loading, error } = useRecord(accountService, accountId, refreshKey);
  return (
    <Drawer isOpen onClose={onClose} title={acc ? acc.accountName : 'Account'} subtitle={acc ? `${CATEGORY_LABEL[acc.category]} · ${acc.accountCode}` : undefined} width="560px" footer={<SecondaryButton style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</SecondaryButton>}>
      <DataState loading={loading} error={error} empty={!loading && !error && !acc}>
        {acc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DrawerStatusBar status={<StatusBadge status={acc.status} />}>
              {canUpdate && (
                <SecondaryButton danger={acc.status === 'active'} icon={acc.status === 'active' ? <FiX size={13} /> : <FiCheck size={13} />} onClick={() => onToggle(acc)}>
                  {acc.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                </SecondaryButton>
              )}
              {canUpdate && <SecondaryButton icon={<FiEdit2 size={13} />} onClick={() => onEdit(acc)}>Edit Account</SecondaryButton>}
            </DrawerStatusBar>
            <TabBar tabs={[{ id: 'info', label: 'Account Information' }, { id: 'entries', label: 'Recent Journal Entries' }]} active={tab} onChange={setTab} />
            {tab === 'info' && (
              <>
                <DetailGrid items={[
                  ['Account code', acc.accountCode],
                  ['Category', CATEGORY_LABEL[acc.category]],
                  ['Account name', acc.accountName],
                  ['Parent account', acc.parentAccount ? accountText(acc.parentAccount) : '—'],
                  ['Current balance', money(acc.currentBalance)],
                  ['Status', acc.status === 'active' ? 'Active (ready for postings)' : 'Inactive'],
                ]} />
                <Panel title="Description">{acc.description || 'No description recorded.'}</Panel>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Audit trail</div>
                  <HistoryList key={acc._id + refreshKey} api={accountService} id={acc._id} empty="No changes recorded since audit tracking started." />
                </div>
              </>
            )}
            {tab === 'entries' && <RecentEntries accountId={acc._id} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}

function AccountsTab({ perms, onChanged, showToast, refreshKey }) {
  const list = useFinanceList(accountsSlice, { initialFilters: { category: '', status: '' }, withStats: false });
  const run = useRunAction(accountsSlice);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [toggleFor, setToggleFor] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const { reload } = list;

  useEffect(() => { if (refreshKey) reload(); }, [refreshKey, reload]);

  const [localKey, setLocalKey] = useState(0);
  const saved = (message) => { setFormFor(null); reload(); onChanged(); setLocalKey((k) => k + 1); showToast(message, 'success'); };

  const confirmToggle = async () => {
    setBusy(true);
    setActionError('');
    const result = await run(toggleFor.status === 'active' ? 'deactivate' : 'activate', toggleFor._id);
    setBusy(false);
    if (!result.ok) { setActionError(result.error); return; }
    showToast(toggleFor.status === 'active' ? 'Account marked as inactive' : 'Account marked as active', 'success');
    setToggleFor(null);
    reload();
    onChanged();
    setLocalKey((k) => k + 1);
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'chart-of-accounts.csv',
        fetchPage: (p) => accountService.list({ ...list.params, page: p, limit: 100 }),
        columns: [
          { label: 'Account Code', value: (r) => r.accountCode },
          { label: 'Account Name', value: (r) => r.accountName },
          { label: 'Category', value: (r) => r.category },
          { label: 'Parent', value: (r) => (r.parentAccount ? accountText(r.parentAccount) : '') },
          { label: 'Current Balance', value: (r) => csvMoney(r.currentBalance) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} account${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const menuFor = (row) => {
    if (!perms.accountUpdate) return [];
    return [
      { label: 'Edit Account', icon: <FiEdit2 size={14} />, action: () => setFormFor(row) },
      row.status === 'active'
        ? { label: 'Mark as Inactive', icon: <FiX size={14} />, color: '#DC2626', action: () => { setActionError(''); setToggleFor(row); } }
        : { label: 'Mark as Active', icon: <FiCheck size={14} />, color: '#16A34A', action: () => { setActionError(''); setToggleFor(row); } },
    ];
  };

  const columns = [
    { key: 'accountCode', label: 'ACCOUNT CODE', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'accountName', label: 'ACCOUNT NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'category', label: 'CATEGORY', render: (v) => <Tag tone={CATEGORY_TONE[v]}>{v}</Tag> },
    { key: 'parentAccount', label: 'PARENT', render: (v) => (v ? accountText(v) : '—') },
    { key: 'currentBalance', label: 'CURRENT BALANCE', render: (v) => <span style={{ fontWeight: 600 }}>{money(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = menuFor(row);
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View account" aria-label="View account"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search account code, name, category…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
        {perms.accountCreate && <SecondaryButton icon={<FiUpload size={14} />} onClick={() => setImportOpen(true)}>Import</SecondaryButton>}
        {perms.accountCreate && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>New Account</PrimaryButton>}
      </ListToolbar>
      <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No accounts found." onRetry={list.reload}>
        <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No accounts found." />
      </DataState>
      <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />

      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter General Ledger" subtitle="Refine accounts by category and status"
        fields={[
          { key: 'category', label: 'Account category', options: CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] })), allLabel: 'All categories' },
          { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }], allLabel: 'All statuses' },
        ]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && (
        <AccountDrawer
          accountId={viewId} canUpdate={perms.accountUpdate} refreshKey={refreshKey + localKey} onClose={() => setViewId(null)}
          onEdit={(acc) => setFormFor(acc)} onToggle={(acc) => { setActionError(''); setToggleFor(acc); }}
        />
      )}
      {formFor && <AccountFormModal account={formFor === 'new' ? null : formFor} onClose={() => setFormFor(null)} onSaved={saved} />}
      {toggleFor && (
        <ConfirmModal
          title={toggleFor.status === 'active' ? 'Mark account as inactive?' : 'Mark account as active?'}
          message={toggleFor.status === 'active' ? 'An account can only be deactivated when its balance is zero and it has no active child accounts. Inactive accounts cannot take postings.' : 'The account will accept postings again.'}
          detail={`${toggleFor.accountCode} – ${toggleFor.accountName}`}
          confirmLabel={toggleFor.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
          danger={toggleFor.status === 'active'} busy={busy} error={actionError}
          onClose={() => setToggleFor(null)} onConfirm={confirmToggle}
        />
      )}
      {importOpen && (
        <ImportDialog
          entity="accounts" title="Import accounts" description="Add many accounts to the chart from a CSV or XLSX file"
          onClose={() => setImportOpen(false)}
          onImported={(report) => { reload(); onChanged(); showToast(`${report.created} account${report.created === 1 ? '' : 's'} added`, 'success'); }}
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Journal entries ───────────────────────────── */

const emptyLine = () => ({ account: '', debit: '', credit: '', memo: '' });

function formFromEntry(entry) {
  const multi = entry.lines && entry.lines.length > 0;
  return {
    mode: multi ? 'multi' : 'pair',
    journalDate: ymd(entry.journalDate),
    entity: refId(entry.entity),
    project: refId(entry.project),
    debitAccount: refId(entry.debitAccount),
    creditAccount: refId(entry.creditAccount),
    amount: fromKobo(entry.amount),
    lines: multi ? entry.lines.map((l) => ({ account: refId(l.account), debit: fromKobo(l.debit || ''), credit: fromKobo(l.credit || ''), memo: l.memo || '' })) : [emptyLine(), emptyLine()],
    currency: entry.currency || 'NGN',
    exchangeRate: entry.currency && entry.currency !== 'NGN' ? String(entry.exchangeRate) : '',
    memo: entry.memo || '',
  };
}

function JournalFormModal({ entry, canSubmit, onClose, onSaved }) {
  const editing = Boolean(entry);
  const run = useRunAction(journalsSlice);
  const entities = useLegalEntityOptions();
  const projects = useProjectOptions();
  const accounts = useAccountOptions();
  const [form, setForm] = useState(() => (editing ? formFromEntry(entry) : {
    mode: 'pair', journalDate: today(), entity: '', project: '', debitAccount: '', creditAccount: '', amount: '',
    lines: [emptyLine(), emptyLine()], currency: 'NGN', exchangeRate: '', memo: '',
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setLine = (i, key, value) => setForm((f) => ({ ...f, lines: f.lines.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)) }));
  const foreign = form.currency !== 'NGN';
  const kobo = (t) => (t === '' ? 0 : toKobo(t));
  const totals = form.lines.reduce((s, l) => ({ debit: s.debit + (kobo(l.debit) || 0), credit: s.credit + (kobo(l.credit) || 0) }), { debit: 0, credit: 0 });
  const balanced = totals.debit === totals.credit && totals.debit > 0;

  const build = () => {
    const body = { journalDate: form.journalDate, entity: form.entity };
    if (form.project) body.project = form.project;
    if (form.memo.trim()) body.memo = form.memo.trim();
    if (foreign) {
      body.currency = form.currency;
      body.exchangeRate = Number(form.exchangeRate);
    }
    if (form.mode === 'pair') {
      Object.assign(body, { debitAccount: form.debitAccount, creditAccount: form.creditAccount, amount: toKobo(form.amount) });
    } else {
      body.lines = form.lines.map((l) => {
        const line = { account: l.account };
        if (kobo(l.debit) > 0) line.debit = kobo(l.debit);
        if (kobo(l.credit) > 0) line.credit = kobo(l.credit);
        if (l.memo.trim()) line.memo = l.memo.trim();
        return line;
      });
    }
    return body;
  };

  const validate = () => {
    const next = {};
    if (!form.journalDate) next.journalDate = 'Choose the journal date';
    if (!form.entity) next.entity = 'Select the legal entity';
    if (foreign && !(Number(form.exchangeRate) > 0)) next.exchangeRate = 'Enter the exchange rate for a foreign journal';
    if (form.mode === 'pair') {
      if (!form.debitAccount) next.debitAccount = 'Select the debit account';
      if (!form.creditAccount) next.creditAccount = 'Select the credit account';
      if (form.debitAccount && form.debitAccount === form.creditAccount) next.creditAccount = 'Must differ from the debit account';
      const amount = toKobo(form.amount);
      if (Number.isNaN(amount) || amount <= 0) next.amount = 'Enter an amount greater than zero';
    } else {
      if (form.lines.some((l) => !l.account)) next.lines = 'Choose an account on every line';
      else if (form.lines.some((l) => Number.isNaN(kobo(l.debit)) || Number.isNaN(kobo(l.credit)) || (kobo(l.debit) > 0) === (kobo(l.credit) > 0))) next.lines = 'Each line needs either a debit or a credit amount';
      else if (!balanced) next.lines = 'Total debits must equal total credits';
    }
    return next;
  };

  const save = async (submitAfter) => {
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    const body = build();
    let result = editing ? await run('update', entry._id, body) : await run('create', body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    const saved = result.data;
    let failed = [];
    if (files.length && saved?._id) failed = await uploadStagedFiles(journalEntryService, saved._id, files);
    if (submitAfter && saved?._id) {
      result = await run('submit', saved._id);
      if (!result.ok) {
        setBusy(false);
        onSaved(`${saved.journalId} saved as a draft, but it could not be submitted: ${result.error}`, failed, 'error');
        return;
      }
    }
    setBusy(false);
    onSaved(editing ? 'Journal entry updated successfully' : submitAfter ? `${saved?.journalId} submitted for approval` : `${saved?.journalId} saved in draft status`, failed);
  };

  const accountChoice = (value, onChange, error) => (
    <Choice value={value} onChange={onChange} options={accounts.options} searchable placeholder={accounts.loading ? 'Loading accounts…' : 'Select account'} error={error} />
  );

  return (
    <Modal isOpen onClose={onClose} title={editing ? `Edit Journal Entry ${entry.journalId}` : 'New Journal Entry'} subtitle="Create a new journal entry for the general ledger" maxWidth="760px">
      <FormBody onSubmit={(e) => { e.preventDefault(); save(false); }}>
        <TwoCol>
          <Field label="Journal date" required error={errors.journalDate}><DatePicker value={form.journalDate} onChange={(e) => set('journalDate', e.target.value)} error={Boolean(errors.journalDate)} /></Field>
          <Field label="Entity" required error={errors.entity}>
            <Choice value={form.entity} onChange={(v) => set('entity', v)} options={entities.options} placeholder={entities.loading ? 'Loading…' : 'Select legal entity'} error={errors.entity} />
          </Field>
        </TwoCol>
        <Field label="Project / cost centre" error={errors.project}>
          <Choice value={form.project} onChange={(v) => set('project', v)} options={[{ value: '', label: 'No project' }, ...projects.options]} searchable placeholder={projects.loading ? 'Loading…' : 'Select project'} />
        </Field>
        <TwoCol>
          <Field label="Currency"><Choice value={form.currency} onChange={(v) => set('currency', v)} options={['NGN', 'USD', 'EUR', 'GBP']} /></Field>
          {foreign ? (
            <Field label="Exchange rate (NGN per 1)" required error={errors.exchangeRate} help="A foreign journal must state its rate; nothing is looked up for manual entries.">
              <Input value={form.exchangeRate} inputMode="decimal" onChange={(e) => set('exchangeRate', e.target.value)} error={Boolean(errors.exchangeRate)} />
            </Field>
          ) : <div />}
        </TwoCol>

        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: 'pair', label: 'Single debit / credit' }, { id: 'multi', label: 'Multi-line journal' }].map((m) => (
            <button key={m.id} type="button" onClick={() => set('mode', m.id)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: form.mode === m.id ? '1px solid #1D4ED8' : '1px solid #E2E8F0', background: form.mode === m.id ? '#EFF6FF' : '#fff', color: form.mode === m.id ? '#1D4ED8' : '#64748B' }}>{m.label}</button>
          ))}
        </div>

        {form.mode === 'pair' ? (
          <>
            <TwoCol>
              <Field label="Debit account" required error={errors.debitAccount}>{accountChoice(form.debitAccount, (v) => set('debitAccount', v), errors.debitAccount)}</Field>
              <Field label="Credit account" required error={errors.creditAccount}>{accountChoice(form.creditAccount, (v) => set('creditAccount', v), errors.creditAccount)}</Field>
            </TwoCol>
            <Field label={`Amount (${form.currency})`} required error={errors.amount}><MoneyInput value={form.amount} onChange={(v) => set('amount', v)} error={errors.amount} /></Field>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.lines.map((line, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,2fr) 1fr 1fr 1.2fr 32px', gap: 8, alignItems: 'start' }}>
                {accountChoice(line.account, (v) => setLine(i, 'account', v), errors.lines && !line.account)}
                <MoneyInput value={line.debit} onChange={(v) => setLine(i, 'debit', v)} placeholder="Debit" />
                <MoneyInput value={line.credit} onChange={(v) => setLine(i, 'credit', v)} placeholder="Credit" />
                <Input value={line.memo} onChange={(e) => setLine(i, 'memo', e.target.value)} placeholder="Memo" />
                <button type="button" aria-label="Remove line" disabled={form.lines.length <= 2} onClick={() => set('lines', form.lines.filter((_, idx) => idx !== i))} style={{ height: 38, background: 'none', border: 'none', color: '#DC2626', cursor: form.lines.length <= 2 ? 'not-allowed' : 'pointer', opacity: form.lines.length <= 2 ? 0.4 : 1 }}><FiX size={15} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <SecondaryButton icon={<FiPlus size={13} />} onClick={() => set('lines', [...form.lines, emptyLine()])}>Add line</SecondaryButton>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: balanced ? '#166534' : '#991B1B' }}>
                Debits {money(totals.debit, form.currency)} · Credits {money(totals.credit, form.currency)} {balanced ? '· Balanced' : '· Not balanced'}
              </span>
            </div>
            {errors.lines && <span style={{ fontSize: '0.78rem', color: '#DC2626' }}>{errors.lines}</span>}
          </div>
        )}

        <Field label="Memo / narration (optional)"><Textarea rows={3} value={form.memo} onChange={(e) => set('memo', e.target.value)} placeholder="Purchase of structural steel for the Chevron wellhead project." /></Field>
        {!editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          {editing ? (
            <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</PrimaryButton>
          ) : (
            <>
              <SecondaryButton onClick={() => save(false)} disabled={busy}>Save Draft</SecondaryButton>
              {canSubmit && <PrimaryButton onClick={() => save(true)} disabled={busy}>{busy ? 'Saving…' : 'Create Journal Entry'}</PrimaryButton>}
            </>
          )}
        </div>
      </FormBody>
    </Modal>
  );
}

function entryLinesOf(entry) {
  if (entry.lines && entry.lines.length) return entry.lines.map((l) => ({ account: accountText(l.account), debit: l.debit, credit: l.credit }));
  return [
    { account: accountText(entry.debitAccount), debit: entry.amount || 0, credit: 0 },
    { account: accountText(entry.creditAccount), debit: 0, credit: entry.amount || 0 },
  ];
}

function ReverseModal({ entry, onClose, onDone }) {
  const run = useRunAction(journalsSlice);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lines = entryLinesOf(entry);
  const submit = async () => {
    if (!reason.trim()) { setError('Enter the reason for the reversal'); return; }
    setBusy(true);
    setError('');
    const result = await run('reverse', entry._id, { reason: reason.trim() });
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    onDone(`${entry.journalId} reversed`);
  };
  return (
    <Modal
      isOpen onClose={onClose} title="Reverse Journal Entry" subtitle="Create a reversing journal to cancel the financial effect of this posted entry" maxWidth="620px"
      footer={<><SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton><PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Reversing…' : 'Confirm Reversal'}</PrimaryButton></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TwoCol>
          <Field label="Journal ID"><Input value={entry.journalId} disabled /></Field>
          <Field label="Journal date"><Input value={formatDate(entry.journalDate)} disabled /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Amount"><Input value={money(entry.totalAmount, entry.currency)} disabled /></Field>
          <Field label="Reversal date" help="Reversals are always dated today and need an open accounting period."><Input value={formatDate(new Date())} disabled /></Field>
        </TwoCol>
        <Field label="Reason for reversal" required>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Duplicate journal entry posted" />
        </Field>
        <div>
          <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Preview</div>
          <SimpleTable
            columns={[
              { key: 'account', label: 'Account' },
              { key: 'debit', label: 'Debit', align: 'right', render: (r) => (r.credit ? money(r.credit, entry.currency) : '—') },
              { key: 'credit', label: 'Credit', align: 'right', render: (r) => (r.debit ? money(r.debit, entry.currency) : '—') },
            ]}
            rows={lines.map((l, i) => ({ ...l, key: i }))}
          />
        </div>
        <FormError message={error} />
      </div>
    </Modal>
  );
}

function JournalDrawer({ entryId, perms, myId, refreshKey, onClose, onAction }) {
  const [tab, setTab] = useState('info');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { record: entry, loading, error } = useRecord(journalEntryService, entryId, refreshKey);

  const exportPdf = async () => {
    setExporting(true);
    setExportError('');
    const failure = await downloadFile(() => journalEntryService.pdf(entryId), `${entry?.journalId || 'journal'}.pdf`);
    if (failure) setExportError(failure);
    setExporting(false);
  };

  const isMaker = entry && entry.createdBy && String(refId(entry.createdBy)) === String(myId);
  const lines = entry ? entryLinesOf(entry) : [];

  return (
    <Drawer isOpen onClose={onClose} title={entry ? entry.journalId : 'Journal entry'} subtitle={entry ? `${personName(entry.createdBy)} · ${formatDate(entry.journalDate)}` : undefined} width="580px" footer={<SecondaryButton style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</SecondaryButton>}>
      <DataState loading={loading} error={error} empty={!loading && !error && !entry}>
        {entry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DrawerStatusBar status={<StatusBadge status={entry.status} />}>
              {entry.status === 'draft' && perms.update && <SecondaryButton icon={<FiEdit2 size={13} />} onClick={() => onAction('edit', entry)}>Edit</SecondaryButton>}
              {entry.status === 'draft' && perms.update && <PrimaryButton icon={<FiSend size={13} />} onClick={() => onAction('submit', entry)}>Submit</PrimaryButton>}
              {entry.status === 'pending_approval' && perms.decide && !isMaker && <PrimaryButton icon={<FiCheck size={13} />} onClick={() => onAction('approve', entry)}>Approve</PrimaryButton>}
              {entry.status === 'pending_approval' && perms.decide && !isMaker && <SecondaryButton danger icon={<FiX size={13} />} onClick={() => onAction('reject', entry)}>Reject</SecondaryButton>}
              {entry.status === 'approved' && perms.decide && <PrimaryButton icon={<FiCheckCircle size={13} />} onClick={() => onAction('post', entry)}>Post to Ledger</PrimaryButton>}
              {entry.status === 'posted' && perms.decide && !entry.reversalOfEntryId && <SecondaryButton danger icon={<FiRefreshCw size={13} />} onClick={() => onAction('reverse', entry)}>Reverse</SecondaryButton>}
              {['posted', 'reversed'].includes(entry.status) && <SecondaryButton icon={<FiDownload size={13} />} onClick={exportPdf} disabled={exporting}>{exporting ? 'Exporting…' : 'Export PDF'}</SecondaryButton>}
            </DrawerStatusBar>
            {exportError && <FormError message={exportError} />}
            {entry.status === 'pending_approval' && isMaker && <Note tone="amber">You created this entry, so a different person must approve or reject it.</Note>}
            {entry.status === 'rejected' && entry.rejectionReason && <Note tone="amber">Rejected: {entry.rejectionReason}</Note>}
            {entry.reversalReason && <Note tone="amber">Reversed: {entry.reversalReason}</Note>}
            <TabBar tabs={[{ id: 'info', label: 'Journal Information' }, { id: 'history', label: 'Approval History' }]} active={tab} onChange={setTab} />
            {tab === 'info' && (
              <>
                <DetailGrid items={[
                  ['Journal ID', entry.journalId],
                  ['Journal date', formatDate(entry.journalDate)],
                  ['Entity', populatedName(entry.entity)],
                  ['Project / cost centre', entry.project ? populatedName(entry.project) : '—'],
                  ['Created by', personName(entry.createdBy)],
                  ['Approved by', entry.approvedBy ? personName(entry.approvedBy) : '—'],
                  ['Posted by', entry.postedBy ? personName(entry.postedBy) : '—'],
                  ['Currency', entry.currency !== 'NGN' ? `${entry.currency} (rate ${entry.exchangeRate})` : entry.currency],
                ]} />
                <SimpleTable
                  columns={[
                    { key: 'account', label: 'Account' },
                    { key: 'debit', label: 'Debit', align: 'right', render: (r) => (r.debit ? money(r.debit, entry.currency) : '—') },
                    { key: 'credit', label: 'Credit', align: 'right', render: (r) => (r.credit ? money(r.credit, entry.currency) : '—') },
                  ]}
                  rows={lines.map((l, i) => ({ ...l, key: i }))}
                />
                <Panel title="Memo / narration">{entry.memo || 'No narration recorded.'}</Panel>
                <DocumentUploads key={entry._id} api={journalEntryService} id={entry._id} canEdit={entry.status === 'draft' && perms.update} />
              </>
            )}
            {tab === 'history' && <HistoryList key={entry._id + refreshKey} api={journalEntryService} id={entry._id} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}

function JournalsTab({ perms, onChanged, showToast, refreshKey }) {
  const myId = useSelector((s) => s.auth.user?._id);
  const list = useFinanceList(journalsSlice, { initialFilters: { status: '', entity: '' }, withStats: false });
  const run = useRunAction(journalsSlice);
  const entities = useLegalEntityOptions();
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [localKey, setLocalKey] = useState(0);
  const { reload } = list;

  useEffect(() => { if (refreshKey) reload(); }, [refreshKey, reload]);

  const refreshAll = () => { reload(); onChanged(); setLocalKey((k) => k + 1); };

  const done = (message, failedUploads, tone) => {
    setFormFor(null);
    setDialog(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, tone || 'success');
  };

  const simple = async (method, entry, message) => {
    setBusy(true);
    setActionError('');
    const result = await run(method, entry._id);
    setBusy(false);
    if (!result.ok) { setActionError(result.error); return; }
    setDialog(null);
    refreshAll();
    showToast(message, 'success');
  };

  const handleAction = (kind, entry) => {
    setActionError('');
    if (kind === 'edit') setFormFor(entry);
    else setDialog({ kind, entry });
  };

  const exportPdf = async (entry) => {
    const failure = await downloadFile(() => journalEntryService.pdf(entry._id), `${entry.journalId}.pdf`);
    if (failure) showToast(failure, 'error');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'journal-entries.csv',
        fetchPage: (p) => journalEntryService.list({ ...list.params, page: p, limit: 100 }),
        columns: [
          { label: 'Journal ID', value: (r) => r.journalId },
          { label: 'Date', value: (r) => ymd(r.journalDate) },
          { label: 'Entity', value: (r) => populatedName(r.entity) },
          { label: 'Description', value: (r) => r.memo || '' },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Debit', value: (r) => csvMoney(r.totalAmount) },
          { label: 'Credit', value: (r) => csvMoney(r.totalAmount) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} journal entr${count === 1 ? 'y' : 'ies'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const menuFor = (row) => {
    const own = row.createdBy && String(refId(row.createdBy)) === String(myId);
    const items = [];
    if (row.status === 'draft' && perms.update) {
      items.push({ label: 'Edit Journal', icon: <FiEdit2 size={14} />, action: () => handleAction('edit', row) });
      items.push({ label: 'Submit Journal', icon: <FiSend size={14} />, color: '#16A34A', action: () => handleAction('submit', row) });
    }
    if (row.status === 'pending_approval' && perms.decide && !own) {
      items.push({ label: 'Approve Journal', icon: <FiCheck size={14} />, color: '#16A34A', action: () => handleAction('approve', row) });
      items.push({ label: 'Reject Journal', icon: <FiX size={14} />, color: '#DC2626', action: () => handleAction('reject', row) });
    }
    if (row.status === 'approved' && perms.decide) items.push({ label: 'Post Journal', icon: <FiCheckCircle size={14} />, color: '#16A34A', action: () => handleAction('post', row) });
    if (row.status === 'posted' && perms.decide && !row.reversalOfEntryId) items.push({ label: 'Reverse Journal', icon: <FiRefreshCw size={14} />, action: () => handleAction('reverse', row) });
    if (['posted', 'reversed'].includes(row.status)) items.push({ label: 'Export PDF', icon: <FiDownload size={14} />, action: () => exportPdf(row) });
    return items;
  };

  const columns = [
    { key: 'journalId', label: 'JOURNAL ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'journalDate', label: 'DATE', render: (v) => formatDate(v) },
    { key: 'entity', label: 'ENTITY', render: (v) => populatedName(v) },
    { key: 'memo', label: 'DESCRIPTION', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v || '—'}</span> },
    { key: 'totalAmount', label: 'DEBIT', render: (v, row) => money(v, row.currency) },
    { key: 'totalAmount', label: 'CREDIT', render: (v, row) => money(v, row.currency) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = menuFor(row);
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View journal entry" aria-label="View journal entry"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search journal ID, narration, entity…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
        {perms.create && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>New Journal Entry</PrimaryButton>}
      </ListToolbar>
      <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No journal entries found." onRetry={list.reload}>
        <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No journal entries found." />
      </DataState>
      <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />

      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Journal Entries" subtitle="Refine by status and legal entity"
        fields={[
          { key: 'status', label: 'Status', options: JOURNAL_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' },
          { key: 'entity', label: 'Legal entity', options: entities.options.map((e) => ({ value: e.value, label: e.label })), allLabel: 'All entities' },
        ]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && <JournalDrawer entryId={viewId} perms={perms} myId={myId} refreshKey={localKey} onClose={() => setViewId(null)} onAction={handleAction} />}
      {formFor && <JournalFormModal entry={formFor === 'new' ? null : formFor} canSubmit={perms.update} onClose={() => setFormFor(null)} onSaved={done} />}

      {dialog?.kind === 'submit' && (
        <ConfirmModal title="Submit for approval?" message="A different person must approve it before it can be posted. You cannot edit it once it is submitted." detail={dialog.entry.journalId} confirmLabel="Submit Journal" busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={() => simple('submit', dialog.entry, `${dialog.entry.journalId} submitted for approval`)} />
      )}
      {dialog?.kind === 'approve' && (
        <ConfirmModal title="Approve journal entry?" message="After approval the entry can be posted to the general ledger." detail={dialog.entry.journalId} confirmLabel="Approve" busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={() => simple('approve', dialog.entry, `${dialog.entry.journalId} approved`)} />
      )}
      {dialog?.kind === 'post' && (
        <ConfirmModal title="Post to the general ledger?" message="Posting writes the entry to the ledger and updates account balances. A posted entry can only be corrected by reversing it." detail={dialog.entry.journalId} confirmLabel="Post Journal" busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={() => simple('post', dialog.entry, `${dialog.entry.journalId} posted to the ledger`)} />
      )}
      {dialog?.kind === 'reject' && (
        <ReasonModal
          title="Reject journal entry?" message="Please provide a reason before continuing." detail={dialog.entry.journalId} label="Reason for rejection" confirmLabel="Reject Journal" danger busy={busy} error={actionError} onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            setBusy(true); setActionError('');
            const result = await run('reject', dialog.entry._id, reason);
            setBusy(false);
            if (!result.ok) { setActionError(result.error); return; }
            setDialog(null); refreshAll(); showToast(`${dialog.entry.journalId} rejected`, 'success');
          }}
        />
      )}
      {dialog?.kind === 'reverse' && <ReverseModal entry={dialog.entry} onClose={() => setDialog(null)} onDone={(m) => done(m)} />}
    </div>
  );
}

/* ───────────────────────────── Ledger drill-down ───────────────────────────── */

function LedgerTab({ showToast }) {
  const accounts = useAccountOptions({ activeOnly: false });
  const [filters, setFilters] = useState({ account: '', periodKey: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ key: '', rows: [], meta: null, error: '' });
  const [exporting, setExporting] = useState(false);

  const params = useMemo(() => {
    const p = { page, limit: 20 };
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    return p;
  }, [page, filters]);
  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    ledgerService.lines(params)
      .then((res) => { if (!cancelled) setState({ key, rows: res.data?.data || [], meta: res.data?.meta || null, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ key, rows: [], meta: null, error: apiError(err, 'Could not load the ledger') }); });
    return () => { cancelled = true; };
  }, [params, key]);

  const loading = state.key !== key;
  const setFilter = (name, value) => { setFilters((f) => ({ ...f, [name]: value })); setPage(1); };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'ledger-lines.csv',
        fetchPage: (p) => ledgerService.lines({ ...params, page: p, limit: 100 }),
        columns: [
          { label: 'Posting Date', value: (r) => ymd(r.postingDate) },
          { label: 'Journal', value: (r) => r.entryRef },
          { label: 'Account', value: (r) => accountText(r.account) },
          { label: 'Narration', value: (r) => r.narration || '' },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Debit', value: (r) => csvMoney(r.debit) },
          { label: 'Credit', value: (r) => csvMoney(r.credit) },
          { label: 'Base Debit (NGN)', value: (r) => csvMoney(r.baseDebit) },
          { label: 'Base Credit (NGN)', value: (r) => csvMoney(r.baseCredit) },
        ],
      });
      showToast(`Exported ${count} ledger line${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, alignItems: 'end' }}>
        <Field label="Account"><Choice value={filters.account} onChange={(v) => setFilter('account', v)} options={[{ value: '', label: 'All accounts' }, ...accounts.options]} searchable placeholder="All accounts" /></Field>
        <Field label="Period (YYYY-MM)"><Input value={filters.periodKey} onChange={(e) => setFilter('periodKey', /^\d{4}-\d{2}$/.test(e.target.value) || e.target.value === '' ? e.target.value : filters.periodKey)} placeholder="2026-10" /></Field>
        <Field label="From"><DatePicker value={filters.from} onChange={(e) => setFilter('from', e.target.value)} /></Field>
        <Field label="To"><DatePicker value={filters.to} onChange={(e) => setFilter('to', e.target.value)} /></Field>
        <SecondaryButton icon={<FiDownload size={14} />} onClick={exportCsv} disabled={exporting}>{exporting ? 'Exporting…' : 'Export'}</SecondaryButton>
      </div>
      <DataState loading={loading} error={!loading && state.error} empty={!loading && !state.error && state.rows.length === 0} emptyText="No ledger lines match these filters.">
        <SimpleTable
          columns={[
            { key: 'postingDate', label: 'Date', render: (r) => formatDate(r.postingDate) },
            { key: 'entryRef', label: 'Journal' },
            { key: 'account', label: 'Account', render: (r) => accountText(r.account) },
            { key: 'narration', label: 'Narration', render: (r) => r.narration || '—' },
            { key: 'debit', label: 'Debit', align: 'right', render: (r) => (r.debit ? money(r.debit, r.currency) : '—') },
            { key: 'credit', label: 'Credit', align: 'right', render: (r) => (r.credit ? money(r.credit, r.currency) : '—') },
          ]}
          rows={state.rows}
        />
      </DataState>
      <Pagination currentPage={state.meta?.page || page} totalPages={state.meta?.totalPages || 1} onPageChange={setPage} />
    </div>
  );
}

/* ───────────────────────────── Accounting periods ───────────────────────────── */

function PeriodsTab({ canClose, onChanged, showToast }) {
  const thisYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(thisYear);
  const [state, setState] = useState({ year: null, rows: [], error: '' });
  const [nonce, setNonce] = useState(0);
  const [closeFor, setCloseFor] = useState(null);
  const [reopenFor, setReopenFor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    ledgerService.periods(year)
      .then((res) => { if (!cancelled) setState({ year, rows: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setState({ year, rows: [], error: apiError(err, 'Could not load the periods') }); });
    return () => { cancelled = true; };
  }, [year, nonce]);

  const loading = state.year !== year;

  const act = async (call, message, close) => {
    setBusy(true);
    setError('');
    try {
      await call();
      close();
      setNonce((n) => n + 1);
      onChanged();
      showToast(message, 'success');
    } catch (err) {
      setError(apiError(err, 'The action failed'));
    }
    setBusy(false);
  };

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 160 }}><Choice value={String(year)} onChange={(v) => setYear(Number(v))} options={[thisYear - 2, thisYear - 1, thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }))} /></div>
        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Closing a period stops postings, reversals and system postings into that month.</span>
      </div>
      <DataState loading={loading} error={!loading && state.error}>
        <SimpleTable
          columns={[
            { key: 'month', label: 'Period', render: (r) => `${MONTHS[r.month - 1]} ${r.year}` },
            { key: 'key', label: 'Key' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={r.status === 'closed' ? 'Closed' : 'Open'} /> },
            { key: 'closedAt', label: 'Closed on', render: (r) => (r.closedAt && r.status === 'closed' ? formatDate(r.closedAt) : '—') },
            { key: 'reopenReason', label: 'Last reopen reason', render: (r) => r.reopenReason || '—' },
            {
              key: 'actions', label: 'Actions', align: 'right',
              render: (r) => (canClose ? (
                r.status === 'closed'
                  ? <SecondaryButton icon={<FiUnlock size={13} />} onClick={() => { setError(''); setReopenFor(r); }}>Reopen</SecondaryButton>
                  : <SecondaryButton icon={<FiLock size={13} />} onClick={() => { setError(''); setCloseFor(r); }}>Close</SecondaryButton>
              ) : '—'),
            },
          ]}
          rows={state.rows}
        />
      </DataState>
      {closeFor && (
        <ConfirmModal
          title="Close accounting period?" message="No further postings, reversals or system postings can be made into this month until it is reopened." detail={`${MONTHS[closeFor.month - 1]} ${closeFor.year}`}
          confirmLabel="Close Period" busy={busy} error={error} onClose={() => setCloseFor(null)}
          onConfirm={() => act(() => ledgerService.close(closeFor.key), `${closeFor.key} closed`, () => setCloseFor(null))}
        />
      )}
      {reopenFor && (
        <ReasonModal
          title="Reopen accounting period?" message="The reason is recorded in the activity trail." detail={`${MONTHS[reopenFor.month - 1]} ${reopenFor.year}`}
          label="Reason for reopening" confirmLabel="Reopen Period" busy={busy} error={error} onClose={() => setReopenFor(null)}
          onConfirm={(reason) => act(() => ledgerService.reopen(reopenFor.key, reason), `${reopenFor.key} reopened`, () => setReopenFor(null))}
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Page ───────────────────────────── */

export default function GeneralLedger() {
  const { toast, showToast, hideToast } = useToast();
  const canAccounts = usePermission('finance.account.view');
  const canJournals = usePermission('finance.journalentry.view');
  const canLedger = usePermission('finance.ledger.view');
  const canPeriods = usePermission('finance.period.view');
  const canClose = usePermission('finance.period.close');
  const canStatements = usePermission('finance.statement.view');
  const perms = {
    accountCreate: usePermission('finance.account.create'),
    accountUpdate: usePermission('finance.account.update'),
    create: usePermission('finance.journalentry.create'),
    update: usePermission('finance.journalentry.update'),
    decide: usePermission('finance.journalentry.decide'),
  };

  const tabs = [
    canAccounts && { id: 'accounts', label: 'Chart of Accounts' },
    canJournals && { id: 'journals', label: 'Journal Entries' },
    canLedger && { id: 'ledger', label: 'Ledger' },
    canPeriods && { id: 'periods', label: 'Accounting Periods' },
  ].filter(Boolean);
  const [tab, setTab] = useState(null);
  const active = tab && tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;

  const [stats, setStats] = useState({ accounts: [], journals: [], loading: true, error: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      canAccounts ? accountService.stats().then((r) => r.data?.data || []) : Promise.resolve([]),
      canJournals ? journalEntryService.stats().then((r) => r.data?.data || []) : Promise.resolve([]),
    ])
      .then(([accountsStats, journalsStats]) => { if (!cancelled) setStats({ accounts: accountsStats, journals: journalsStats, loading: false, error: false }); })
      .catch(() => { if (!cancelled) setStats({ accounts: [], journals: [], loading: false, error: true }); });
    return () => { cancelled = true; };
  }, [canAccounts, canJournals, refreshKey]);

  const onChanged = () => setRefreshKey((k) => k + 1);

  const exportTrialBalance = async () => {
    setExporting(true);
    const failure = await downloadFile(() => financialStatementService.trialBalance({}, 'xlsx'), 'trial-balance.xlsx');
    if (failure) showToast(failure, 'error');
    else showToast('Trial balance exported', 'success');
    setExporting(false);
  };

  const tiles = [
    { label: 'Total accounts', value: statValue(stats.accounts, 'total_accounts'), sub: `${statValue(stats.accounts, 'new_this_month')} new accounts created this month`, icon: <FiBook size={15} />, tone: 'blue' },
    { label: 'Active accounts', value: statValue(stats.accounts, 'active_accounts'), sub: `${statValue(stats.accounts, 'inactive_accounts')} inactive accounts`, icon: <FiCheckCircle size={15} />, tone: 'green' },
    { label: 'Journal entries posted', value: statValue(stats.journals, 'posted'), sub: `${statValue(stats.journals, 'pending_approval')} awaiting review`, icon: <FiFileText size={15} />, tone: 'purple' },
    { label: 'General ledger balance', value: compactMoney(statValue(stats.accounts, 'gl_balance')), sub: 'Total assets, consolidated (all entities)', icon: <FiBook size={15} />, tone: 'slate' },
  ];

  if (!tabs.length) return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view the general ledger.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="General Ledger" subtitle="Manage the organisation's chart of accounts and journal entries to maintain accurate financial records">
        {canStatements && <SecondaryButton icon={<FiDownload size={14} />} onClick={exportTrialBalance} disabled={exporting}>{exporting ? 'Exporting…' : 'Export Trial Balance'}</SecondaryButton>}
      </PageHeader>
      <StatTiles tiles={tiles} loading={stats.loading} error={stats.error} />
      <TabBar tabs={tabs} active={active} onChange={setTab} />
      {active === 'accounts' && <AccountsTab perms={perms} onChanged={onChanged} showToast={showToast} refreshKey={0} />}
      {active === 'journals' && <JournalsTab perms={perms} onChanged={onChanged} showToast={showToast} refreshKey={0} />}
      {active === 'ledger' && <LedgerTab showToast={showToast} />}
      {active === 'periods' && <PeriodsTab canClose={canClose} onChanged={onChanged} showToast={showToast} />}
    </div>
  );
}
