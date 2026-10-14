import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiPlus, FiEye, FiEdit2, FiCreditCard, FiSend, FiDownload, FiX, FiFileText, FiClock, FiAlertTriangle, FiCheckCircle, FiUpload,
} from 'react-icons/fi';
import ImportDialog from '../hr/ImportDialog';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';
import { apiError, populatedName } from '../../services/apiHelpers';
import { invoiceService } from '../../services/finance.service';
import { invoicesSlice } from '../../store/finance/slices';
import {
  Choice, ConfirmModal, DataState, Field, FilterDrawer, FormBody, FormError, ListToolbar,
  MoneyInput, Note, PageHeader, PrimaryButton, ReasonModal, SecondaryButton, StatTiles, StatusBadge, TwoCol,
} from './shared/FinanceUi';
import { AttachField } from './shared/FinanceRecordExtras';
import {
  compactMoney, countFilters, csvMoney, downloadFile, exportRowsCsv, fieldErrorsOf, formatDate, fromKobo, money, statValue,
  statusLabel, toKobo, today, uploadStagedFiles, useDebounced, ymd,
} from './shared/financeUtils';
import { useClientOptions, useProjectOptions } from './shared/useRefOptions';
import RecordPaymentModal from './shared/RecordPaymentModal';
import InvoiceDrawer from './shared/InvoiceDrawer';

const PAGE_SIZE = 10;
const { fetchList, fetchStats, runAction } = invoicesSlice;

const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'];
const PAYMENT_TERMS = ['Due on receipt', 'Net 15 Days', 'Net 30 Days', 'Net 45 Days', 'Net 60 Days'];
const STATUS_OPTIONS = ['issued', 'partially_paid', 'overdue', 'paid', 'cancelled'].map((s) => ({ value: s, label: statusLabel(s) }));
const OPEN = ['issued', 'partially_paid', 'overdue'];

const isOpen = (inv) => OPEN.includes(inv.status);
const hasPayments = (inv) => (inv.payments || []).length > 0;
const refId = (v) => (v && typeof v === 'object' ? v._id : v) || '';

const emptyForm = () => ({
  client: '', project: '', issueDate: today(), dueDate: '', currency: 'NGN', exchangeRate: '',
  workValuation: '', vat: '', wht: '', retention: '', paymentTerms: 'Net 30 Days', description: '',
});

function formFromInvoice(inv) {
  return {
    client: refId(inv.client), project: refId(inv.project), issueDate: ymd(inv.issueDate), dueDate: ymd(inv.dueDate),
    currency: inv.currency || 'NGN', exchangeRate: inv.currency && inv.currency !== 'NGN' ? String(inv.exchangeRate) : '',
    workValuation: fromKobo(inv.workValuation), vat: fromKobo(inv.vat), wht: fromKobo(inv.wht), retention: fromKobo(inv.retention),
    paymentTerms: inv.paymentTerms || '', description: inv.description || '',
  };
}

const kobo = (text) => (text === '' ? 0 : toKobo(text));

function InvoiceFormModal({ invoice, canAttach, onClose, onSaved }) {
  const dispatch = useDispatch();
  const editing = Boolean(invoice);
  const locked = editing && hasPayments(invoice);
  const [form, setForm] = useState(() => (editing ? formFromInvoice(invoice) : emptyForm()));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const clients = useClientOptions();
  const projects = useProjectOptions(form.client);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const net = kobo(form.workValuation) + kobo(form.vat) - kobo(form.wht) - kobo(form.retention);
  const foreign = form.currency !== 'NGN';

  const validate = () => {
    const next = {};
    if (!form.client) next.client = 'Select a client';
    if (!form.dueDate) next.dueDate = 'Choose the due date';
    ['workValuation', 'vat', 'wht', 'retention'].forEach((key) => {
      if (form[key] !== '' && (Number.isNaN(toKobo(form[key])) || toKobo(form[key]) < 0)) next[key] = 'Enter a valid amount';
    });
    if (form.workValuation === '' || toKobo(form.workValuation) <= 0) next.workValuation = next.workValuation || 'Enter the work valuation';
    if (!next.workValuation && !next.vat && !next.wht && !next.retention && net < 0) next.wht = 'Deductions exceed the invoice total';
    if (foreign && form.exchangeRate !== '' && !(Number(form.exchangeRate) > 0)) next.exchangeRate = 'Enter a positive rate';
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    const payload = {
      client: form.client,
      dueDate: form.dueDate,
      issueDate: form.issueDate || undefined,
      paymentTerms: form.paymentTerms || undefined,
      description: form.description || undefined,
    };
    if (form.project) payload.project = form.project;
    if (!locked) {
      Object.assign(payload, {
        workValuation: kobo(form.workValuation), vat: kobo(form.vat), wht: kobo(form.wht), retention: kobo(form.retention),
        currency: form.currency,
      });
      if (foreign && form.exchangeRate !== '') payload.exchangeRate = Number(form.exchangeRate);
    } else {
      delete payload.issueDate;
      delete payload.project;
    }
    if (editing) {
      const original = formFromInvoice(invoice);
      const unchanged = (key) => form[key] === original[key];
      ['issueDate', 'project', 'currency', 'exchangeRate'].forEach((key) => { if (unchanged(key)) delete payload[key]; });
      ['workValuation', 'vat', 'wht', 'retention'].forEach((key) => { if (kobo(form[key]) === kobo(original[key])) delete payload[key]; });
      if (payload.client === original.client) delete payload.client;
      if (payload.dueDate === original.dueDate) delete payload.dueDate;
      if (Object.keys(payload).length === 0) {
        setBusy(false);
        onSaved('No changes to save', []);
        return;
      }
    }
    setBusy(true);
    const result = await dispatch(runAction(editing
      ? { method: 'update', args: [invoice._id, payload] }
      : { method: 'create', args: [payload] }));
    if (result.meta.requestStatus !== 'fulfilled') {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.payload?.message || 'Could not save the invoice');
      return;
    }
    const saved = result.payload;
    let failed = [];
    if (files.length && saved?._id) failed = await uploadStagedFiles(invoiceService, saved._id, files);
    setBusy(false);
    onSaved(editing ? 'Invoice updated successfully' : `Invoice ${saved?.invoiceId || ''} issued`, failed);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? `Edit Invoice ${invoice.invoiceId}` : 'Create Invoice'}
      subtitle={editing ? 'Update the invoice details' : 'Create and issue a client invoice'}
      maxWidth="680px"
    >
      <FormBody onSubmit={submit}>
        {locked && <Note tone="amber">A payment has been recorded on this invoice, so its amounts, currency and project are locked. Only the client, due date, terms and description can change.</Note>}
        <TwoCol>
          <Field label="Invoice ID" required><Input value={editing ? invoice.invoiceId : 'Assigned on save'} disabled /></Field>
          <Field label="Client" required error={errors.client}>
            <Choice value={form.client} onChange={(v) => { set('client', v); set('project', ''); }} options={clients.options} placeholder={clients.loading ? 'Loading clients…' : 'Select client'} searchable error={errors.client} />
          </Field>
        </TwoCol>
        <Field label="Project" error={errors.project}>
          <Choice value={form.project} onChange={(v) => set('project', v)} options={[{ value: '', label: 'No project' }, ...projects.options]} placeholder={projects.loading ? 'Loading projects…' : 'Select project'} searchable disabled={locked} error={errors.project} />
        </Field>
        <TwoCol>
          <Field label="Invoice date" error={errors.issueDate}><DatePicker value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} disabled={locked} /></Field>
          <Field label="Due date" required error={errors.dueDate}><DatePicker value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} error={Boolean(errors.dueDate)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Currency" required><Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} disabled={locked} /></Field>
          {foreign ? (
            <Field label="Exchange rate (NGN per 1)" error={errors.exchangeRate} help="Leave blank to use the rate in the exchange-rate table. A foreign invoice with no rate is refused.">
              <Input value={form.exchangeRate} inputMode="decimal" onChange={(e) => set('exchangeRate', e.target.value)} disabled={locked} error={Boolean(errors.exchangeRate)} />
            </Field>
          ) : <div />}
        </TwoCol>
        <TwoCol>
          <Field label="Work valuation" required error={errors.workValuation}><MoneyInput value={form.workValuation} onChange={(v) => set('workValuation', v)} disabled={locked} error={errors.workValuation} /></Field>
          <Field label="VAT" error={errors.vat}><MoneyInput value={form.vat} onChange={(v) => set('vat', v)} disabled={locked} error={errors.vat} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="WHT (withheld by client)" error={errors.wht}><MoneyInput value={form.wht} onChange={(v) => set('wht', v)} disabled={locked} error={errors.wht} /></Field>
          <Field label="Retention" error={errors.retention}><MoneyInput value={form.retention} onChange={(v) => set('retention', v)} disabled={locked} error={errors.retention} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Debt receivable (net amount)"><Input value={net >= 0 ? money(net, form.currency) : '—'} disabled /></Field>
          <Field label="Payment terms"><Choice value={form.paymentTerms} onChange={(v) => set('paymentTerms', v)} options={PAYMENT_TERMS} placeholder="Select terms" /></Field>
        </TwoCol>
        <Field label="Description (optional)"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Milestone deliverables completed…" /></Field>
        {canAttach && (
          <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>
        )}
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Invoice'}</PrimaryButton>
        </div>
      </FormBody>
    </Modal>
  );
}

export default function Invoicing() {
  const dispatch = useDispatch();
  const { items, meta, stats, loading, error, statsLoading, statsError } = useSelector((s) => s.finInvoices);
  const { toast, showToast, hideToast } = useToast();
  const canView = usePermission('finance.invoice.view');
  const canCreate = usePermission('finance.invoice.create');
  const canUpdate = usePermission('finance.invoice.update');
  const canDecide = usePermission('finance.invoice.decide');
  const perms = useMemo(() => ({ create: canCreate, update: canUpdate, decide: canDecide, attach: canCreate || canUpdate || canDecide }), [canCreate, canUpdate, canDecide]);

  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const search = useDebounced(searchText.trim(), 400);
  const [filters, setFilters] = useState({ status: '', client: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [cancelFor, setCancelFor] = useState(null);
  const [remindFor, setRemindFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const clients = useClientOptions();

  const params = useMemo(() => {
    const p = { page, limit: PAGE_SIZE };
    if (search) p.q = search;
    if (filters.status) p.status = filters.status;
    if (filters.client) p.client = filters.client;
    return p;
  }, [page, search, filters]);

  useEffect(() => {
    if (canView) dispatch(fetchList(params));
  }, [dispatch, params, canView]);

  useEffect(() => {
    if (canView) dispatch(fetchStats());
  }, [dispatch, canView]);

  const reload = useCallback(() => {
    dispatch(fetchList(params));
    dispatch(fetchStats());
    setRefreshKey((k) => k + 1);
  }, [dispatch, params]);

  const afterSave = (message, failedUploads) => {
    setFormFor(null);
    setPayFor(null);
    reload();
    if (failedUploads?.length) showToast(`${message}, but some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, 'success');
  };

  const runSimple = async (method, args, successMessage, close) => {
    setBusy(true);
    setActionError('');
    const result = await dispatch(runAction({ method, args }));
    setBusy(false);
    if (result.meta.requestStatus !== 'fulfilled') {
      setActionError(result.payload?.message || 'The action failed');
      return;
    }
    close();
    reload();
    showToast(successMessage, 'success');
  };

  const handleAction = (kind, inv) => {
    setActionError('');
    if (kind === 'pay') setPayFor(inv);
    if (kind === 'edit') setFormFor(inv);
    if (kind === 'cancel') setCancelFor(inv);
    if (kind === 'remind') setRemindFor(inv);
  };

  const exportPdf = async (inv) => {
    const failure = await downloadFile(() => invoiceService.pdf(inv._id), `${inv.invoiceId}.pdf`);
    if (failure) showToast(failure, 'error');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'invoices.csv',
        fetchPage: (p) => invoiceService.list({ ...params, page: p, limit: 100 }),
        columns: [
          { label: 'Invoice No', value: (r) => r.invoiceId },
          { label: 'Client', value: (r) => populatedName(r.client) },
          { label: 'Project', value: (r) => (r.project ? populatedName(r.project) : '') },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Work Valuation', value: (r) => csvMoney(r.workValuation) },
          { label: 'VAT', value: (r) => csvMoney(r.vat) },
          { label: 'WHT', value: (r) => csvMoney(r.wht) },
          { label: 'Retention', value: (r) => csvMoney(r.retention) },
          { label: 'Debt Receivable', value: (r) => csvMoney(r.netReceivable) },
          { label: 'Outstanding', value: (r) => csvMoney(r.outstanding) },
          { label: 'Due Date', value: (r) => ymd(r.dueDate) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} invoice${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const menuFor = (inv) => {
    const entries = [];
    if (isOpen(inv) && canDecide) {
      entries.push({ label: 'Record Payment', icon: <FiCreditCard size={14} />, action: () => handleAction('pay', inv) });
      entries.push({ label: 'Payment Reminder', icon: <FiSend size={14} />, action: () => handleAction('remind', inv) });
    }
    if (isOpen(inv) && canUpdate) entries.push({ label: 'Edit Invoice', icon: <FiEdit2 size={14} />, action: () => handleAction('edit', inv) });
    if (isOpen(inv) && canDecide && !hasPayments(inv)) entries.push({ label: 'Cancel Invoice', icon: <FiX size={14} />, color: '#DC2626', action: () => handleAction('cancel', inv) });
    if (inv.status !== 'cancelled') entries.push({ label: 'Export Receipt', icon: <FiDownload size={14} />, action: () => exportPdf(inv) });
    return entries;
  };

  const columns = [
    { key: 'invoiceId', label: 'INVOICE NO.', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'client', label: 'CLIENT', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{populatedName(v)}</span> },
    { key: 'project', label: 'PROJECT', render: (v) => (v ? populatedName(v) : '—') },
    { key: 'workValuation', label: 'WORK VALUATION', render: (v, row) => money(v, row.currency) },
    { key: 'wht', label: 'WHT', render: (v, row) => money(v, row.currency) },
    { key: 'netReceivable', label: 'DEBT RECEIVABLE', render: (v, row) => money(v, row.currency) },
    { key: 'outstanding', label: 'OUTSTANDING', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'dueDate', label: 'DUE DATE', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = menuFor(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View invoice" aria-label="View invoice"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  const tiles = [
    { label: 'Total invoices', value: compactMoney(statValue(stats, 'total_value')), sub: 'Total invoice value generated', icon: <FiFileText size={15} />, tone: 'green' },
    { label: 'Outstanding invoices', value: compactMoney(statValue(stats, 'outstanding_amount')), sub: 'Awaiting client payment', icon: <FiClock size={15} />, tone: 'amber' },
    { label: 'Paid invoices', value: compactMoney(statValue(stats, 'paid_amount')), sub: 'Invoices settled by clients', icon: <FiCheckCircle size={15} />, tone: 'purple' },
    { label: 'Overdue invoices', value: compactMoney(statValue(stats, 'overdue_amount')), sub: 'Past due client invoices', icon: <FiAlertTriangle size={15} />, tone: 'red' },
  ];

  if (!canView) {
    return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view invoices.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Invoicing" subtitle="Create, issue, and track customer invoices across projects">
        {canCreate && <SecondaryButton icon={<FiUpload size={14} />} onClick={() => setImportOpen(true)}>Upload</SecondaryButton>}
      </PageHeader>
      <StatTiles tiles={tiles} loading={statsLoading && stats.length === 0} error={Boolean(statsError)} />

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <ListToolbar
          search={searchText}
          onSearch={(v) => { setSearchText(v); setPage(1); }}
          placeholder="Search invoice ID, client, project…"
          onFilter={() => setFilterOpen(true)}
          filterCount={countFilters(filters)}
          onExport={exportList}
          exporting={exporting}
        >
          {canCreate && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Create Invoice</PrimaryButton>}
        </ListToolbar>

        <DataState loading={loading && items.length === 0} error={error} empty={!loading && items.length === 0} emptyText="No invoices found." onRetry={reload}>
          <DataTable columns={columns} data={items} keyField="_id" emptyMessage="No invoices found." />
        </DataState>
        <Pagination currentPage={meta?.page || page} totalPages={meta?.totalPages || 1} onPageChange={setPage} />
      </div>

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Invoices"
        subtitle="Filter by payment status and client"
        fields={[
          { key: 'status', label: 'Invoice status', options: STATUS_OPTIONS, allLabel: 'All statuses' },
          { key: 'client', label: 'Client', options: clients.options.map((c) => ({ value: c.value, label: c.label })), allLabel: 'All clients' },
        ]}
        values={filters}
        onApply={(next) => { setFilters(next); setPage(1); }}
      />

      {importOpen && (
        <ImportDialog
          entity="invoices"
          title="Upload invoices"
          description="Issue many client invoices from a CSV or XLSX file"
          onClose={() => setImportOpen(false)}
          onImported={(report) => { reload(); showToast(`${report.created} invoice${report.created === 1 ? '' : 's'} issued`, 'success'); }}
        />
      )}

      {viewId && (
        <InvoiceDrawer invoiceId={viewId} perms={perms} refreshKey={refreshKey} onClose={() => setViewId(null)} onAction={handleAction} />
      )}

      {formFor && (
        <InvoiceFormModal invoice={formFor === 'new' ? null : formFor} canAttach={perms.attach} onClose={() => setFormFor(null)} onSaved={afterSave} />
      )}
      {payFor && <RecordPaymentModal kind="receipt" slice={invoicesSlice} api={invoiceService} record={payFor} canAttach={perms.attach} onClose={() => setPayFor(null)} onSaved={afterSave} />}

      {cancelFor && (
        <ReasonModal
          title="Cancel invoice?"
          message="The ledger entry for this invoice is reversed. An invoice that has received a payment cannot be cancelled."
          detail={`${cancelFor.invoiceId} – ${populatedName(cancelFor.client)}`}
          label="Reason for cancellation"
          confirmLabel="Cancel Invoice"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setCancelFor(null)}
          onConfirm={(reason) => runSimple('cancel', [cancelFor._id, reason], 'Invoice cancelled', () => setCancelFor(null))}
        />
      )}
      {remindFor && (
        <ConfirmModal
          title="Send payment reminder?"
          message="The client's contact is emailed a reminder for this invoice (when external email is enabled for the company)."
          detail={`${remindFor.invoiceId} – outstanding ${money(remindFor.outstanding, remindFor.currency)}`}
          confirmLabel="Send Reminder"
          busy={busy}
          error={actionError}
          onClose={() => setRemindFor(null)}
          onConfirm={() => runSimple('sendReminder', [remindFor._id], 'Payment reminder sent', () => setRemindFor(null))}
        />
      )}
    </div>
  );
}
