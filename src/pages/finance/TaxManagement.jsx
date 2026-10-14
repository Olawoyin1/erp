import { useState } from 'react';
import { FiPlus, FiEye, FiEdit2, FiCheck, FiTrash2, FiSend, FiCreditCard, FiFileText, FiClock, FiDollarSign, FiList } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';
import { apiError, populatedName } from '../../services/apiHelpers';
import { taxRecordService } from '../../services/finance.service';
import { taxRecordsSlice } from '../../store/finance/slices';
import {
  Choice, ConfirmModal, DataState, Field, FilterDrawer, FormBody, FormError, ListToolbar, MoneyInput, Note, PageHeader, PrimaryButton, ReasonModal,
  SecondaryButton, StatTiles, StatusBadge, Tag, TwoCol,
} from './shared/FinanceUi';
import { AttachField } from './shared/FinanceRecordExtras';
import RecordDrawer from './shared/RecordDrawer';
import {
  compactMoney, countFilters, csvMoney, exportRowsCsv, fieldErrorsOf, formatDate, fromKobo, money, statValue, statusLabel, toKobo, today,
  uploadStagedFiles, ymd,
} from './shared/financeUtils';
import { useAccountOptions, useLegalEntityOptions } from './shared/useRefOptions';
import { useFinanceList, useRunAction } from './shared/useFinanceList';
import { useActionDialog } from './shared/useActionDialog';

const TAX_TYPES = ['VAT', 'WHT', 'CIT', 'NCD Levy'];
const STATUSES = ['draft', 'pending_filing', 'filed', 'paid'];
const PAYMENT_METHODS = ['Bank Transfer', 'Remita RRR', 'Cheque', 'Cash'];
const refId = (v) => (v && typeof v === 'object' ? v._id : v) || '';

function periodSuggestion() {
  const d = new Date();
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

function TaxFormModal({ record, canSubmit, onClose, onSaved }) {
  const editing = Boolean(record);
  const run = useRunAction(taxRecordsSlice);
  const entities = useLegalEntityOptions();
  const [form, setForm] = useState(() => (editing ? {
    taxType: record.taxType, taxEntity: refId(record.taxEntity), filingPeriod: record.filingPeriod, taxAmount: fromKobo(record.taxAmount), dueDate: ymd(record.dueDate),
    taxReference: record.taxReference || '', remarks: record.remarks || '',
  } : { taxType: 'VAT', taxEntity: '', filingPeriod: '', taxAmount: '', dueDate: '', taxReference: '', remarks: '' }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (submitAfter) => {
    const next = {};
    if (!form.taxEntity) next.taxEntity = 'Select the legal entity';
    if (!form.filingPeriod.trim()) next.filingPeriod = `Enter the filing period, e.g. ${periodSuggestion()}`;
    if (form.taxAmount === '' || Number.isNaN(toKobo(form.taxAmount)) || toKobo(form.taxAmount) < 0) next.taxAmount = 'Enter the tax amount';
    if (!form.dueDate) next.dueDate = 'Choose the due date';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const body = {
      taxType: form.taxType, taxEntity: form.taxEntity, filingPeriod: form.filingPeriod.trim(), taxAmount: toKobo(form.taxAmount), dueDate: form.dueDate,
      taxReference: form.taxReference.trim() || undefined, remarks: form.remarks.trim() || undefined,
    };
    setBusy(true);
    let result = editing ? await run('update', record._id, body) : await run('create', body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    const saved = result.data;
    let failed = [];
    if (files.length && saved?._id) failed = await uploadStagedFiles(taxRecordService, saved._id, files);
    if (submitAfter && saved?._id && saved.status === 'draft') {
      result = await run('submitFiling', saved._id);
      if (!result.ok) {
        setBusy(false);
        onSaved(`${saved.taxId} saved as a draft, but it could not be submitted for filing: ${result.error}`, failed, 'error');
        return;
      }
    }
    setBusy(false);
    onSaved(editing ? 'Tax record updated successfully' : `${saved?.taxId} ${submitAfter ? 'submitted for filing' : 'saved as a draft'}`, failed);
  };

  return (
    <Modal isOpen onClose={onClose} title={editing ? `Edit Filing ${record.taxId}` : 'Add Tax Record'} subtitle="Record a tax obligation for filing and payment" maxWidth="680px">
      <FormBody onSubmit={(e) => { e.preventDefault(); save(false); }}>
        <TwoCol>
          <Field label="Tax ID"><Input value={editing ? record.taxId : 'Assigned on save'} disabled /></Field>
          <Field label="Tax type" required><Choice value={form.taxType} onChange={(v) => set('taxType', v)} options={TAX_TYPES} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Tax entity" required error={errors.taxEntity}>
            <Choice value={form.taxEntity} onChange={(v) => set('taxEntity', v)} options={entities.options} placeholder={entities.loading ? 'Loading…' : 'Select legal entity'} error={errors.taxEntity} />
          </Field>
          <Field label="Filing period" required error={errors.filingPeriod}><Input value={form.filingPeriod} onChange={(e) => set('filingPeriod', e.target.value)} placeholder={`e.g. ${periodSuggestion()}`} error={Boolean(errors.filingPeriod)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Currency"><Input value="NGN" disabled /></Field>
          <Field label="Tax amount" required error={errors.taxAmount}><MoneyInput value={form.taxAmount} onChange={(v) => set('taxAmount', v)} error={errors.taxAmount} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Due date" required error={errors.dueDate}><DatePicker value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} error={Boolean(errors.dueDate)} /></Field>
          <Field label="Tax reference" help="The FIRS-issued reference, when you have it."><Input value={form.taxReference} onChange={(e) => set('taxReference', e.target.value)} placeholder="e.g. VAT-Q2-2026-001" /></Field>
        </TwoCol>
        <Field label="Remarks (optional)"><Textarea rows={3} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="VAT liability for Q2 2026 operations." /></Field>
        {!editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          {editing ? (
            <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</PrimaryButton>
          ) : (
            <>
              <SecondaryButton onClick={() => save(false)} disabled={busy}>Save as Draft</SecondaryButton>
              {canSubmit && <PrimaryButton onClick={() => save(true)} disabled={busy}>{busy ? 'Saving…' : 'Add Tax Record'}</PrimaryButton>}
            </>
          )}
        </div>
      </FormBody>
    </Modal>
  );
}

function PaymentModal({ record, canAttach, onClose, onSaved }) {
  const run = useRunAction(taxRecordsSlice);
  const accounts = useAccountOptions({ category: 'Asset' });
  const [form, setForm] = useState({ paymentDate: today(), method: 'Bank Transfer', reference: '', bankAccount: '', remarks: '' });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.paymentDate) next.paymentDate = 'Choose the payment date';
    if (!form.reference.trim()) next.reference = 'Enter the remittance reference or RRR';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const body = { amountPaid: record.taxAmount, paymentDate: form.paymentDate, method: form.method, reference: form.reference.trim() };
    if (form.bankAccount) body.bankAccount = form.bankAccount;
    if (form.remarks.trim()) body.remarks = form.remarks.trim();
    setBusy(true);
    const result = await run('recordPayment', record._id, body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    let failed = [];
    if (files.length) failed = await uploadStagedFiles(taxRecordService, record._id, files);
    setBusy(false);
    onSaved(`${record.taxId} payment recorded`, failed);
  };

  return (
    <Modal isOpen onClose={onClose} title="Record Payment" subtitle="Record payment for this tax obligation" maxWidth="640px">
      <FormBody onSubmit={submit}>
        <TwoCol>
          <Field label="Tax ID"><Input value={record.taxId} disabled /></Field>
          <Field label="Tax type"><Input value={record.taxType} disabled /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Amount paid" help="A tax record is settled in full."><Input value={money(record.taxAmount)} disabled /></Field>
          <Field label="Payment date" required error={errors.paymentDate}><DatePicker value={form.paymentDate} onChange={(e) => set('paymentDate', e.target.value)} error={Boolean(errors.paymentDate)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Payment method" required><Choice value={form.method} onChange={(v) => set('method', v)} options={PAYMENT_METHODS} /></Field>
          <Field label="Payment reference" required error={errors.reference}><Input value={form.reference} onChange={(e) => set('reference', e.target.value)} placeholder="e.g. FIRS-TRX-20260710-001" error={Boolean(errors.reference)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Due date"><Input value={formatDate(record.dueDate)} disabled /></Field>
          <Field label="Tax reference"><Input value={record.taxReference || '—'} disabled /></Field>
        </TwoCol>
        <Field label="Payment account" error={errors.bankAccount} help="Leave blank to use the default bank account.">
          <Choice value={form.bankAccount} onChange={(v) => set('bankAccount', v)} options={[{ value: '', label: 'Default bank account' }, ...accounts.options]} searchable placeholder={accounts.loading ? 'Loading accounts…' : 'Select account'} />
        </Field>
        <Field label="Remarks (optional)"><Textarea rows={3} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="VAT payment remitted to FIRS." /></Field>
        {canAttach && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <Note>The payment is posted to the ledger: debit the matching tax liability account, credit the bank.</Note>
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Recording…' : 'Record Payment'}</PrimaryButton>
        </div>
      </FormBody>
    </Modal>
  );
}

export default function TaxManagement() {
  const { toast, showToast, hideToast } = useToast();
  const canView = usePermission('finance.taxrecord.view');
  const canCreate = usePermission('finance.taxrecord.create');
  const canUpdate = usePermission('finance.taxrecord.update');
  const canDecide = usePermission('finance.taxrecord.decide');
  const canDelete = usePermission('finance.taxrecord.delete');
  const list = useFinanceList(taxRecordsSlice, { initialFilters: { taxType: '', status: '' }, enabled: canView });
  const run = useRunAction(taxRecordsSlice);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [localKey, setLocalKey] = useState(0);
  const { reload } = list;

  const refreshAll = (message) => {
    reload();
    setLocalKey((k) => k + 1);
    if (message) showToast(message, 'success');
  };
  const dlg = useActionDialog(run, (message, method) => {
    if (method === 'remove') setViewId(null);
    refreshAll(message);
  });

  const afterSave = (message, failedUploads, tone) => {
    setFormFor(null);
    setPayFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, tone || 'success');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'tax-records.csv',
        fetchPage: (n) => taxRecordService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Tax ID', value: (r) => r.taxId },
          { label: 'Tax Type', value: (r) => r.taxType },
          { label: 'Filing Period', value: (r) => r.filingPeriod },
          { label: 'Tax Amount', value: (r) => csvMoney(r.taxAmount) },
          { label: 'Tax Entity', value: (r) => populatedName(r.taxEntity) },
          { label: 'Tax Reference', value: (r) => r.taxReference || '' },
          { label: 'Due Date', value: (r) => ymd(r.dueDate) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
          { label: 'Payment Date', value: (r) => ymd(r.paymentDate) },
          { label: 'Payment Reference', value: (r) => r.paymentReference || '' },
        ],
      });
      showToast(`Exported ${count} tax record${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const actionsFor = (r) => {
    const items = [];
    if (['draft', 'pending_filing'].includes(r.status) && canUpdate) items.push({ key: 'edit', label: 'Edit Filing', icon: <FiEdit2 size={14} /> });
    if (r.status === 'draft' && canUpdate) items.push({ key: 'submit', label: 'Submit Filing', icon: <FiSend size={14} />, color: '#16A34A' });
    if (r.status === 'pending_filing' && canDecide) items.push({ key: 'filed', label: 'Mark as Filed', icon: <FiCheck size={14} />, color: '#16A34A' });
    if (r.status === 'filed' && canDecide) items.push({ key: 'pay', label: 'Record Payment', icon: <FiCreditCard size={14} />, color: '#16A34A' });
    if (r.status === 'draft' && canDelete) items.push({ key: 'delete', label: 'Delete Filing', icon: <FiTrash2 size={14} />, color: '#DC2626' });
    return items;
  };

  const trigger = (key, r) => {
    if (key === 'edit') setFormFor(r);
    else if (key === 'pay') setPayFor(r);
    else dlg.open(key, r);
  };

  const columns = [
    { key: 'taxId', label: 'TAX ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'taxType', label: 'TAX TYPE', render: (v) => <Tag tone="blue">{v}</Tag> },
    { key: 'filingPeriod', label: 'FILING PERIOD' },
    { key: 'taxAmount', label: 'TAX AMOUNT', render: (v) => <span style={{ fontWeight: 600 }}>{money(v)}</span> },
    { key: 'taxEntity', label: 'TAX ENTITY', render: (v) => populatedName(v) },
    { key: 'dueDate', label: 'DUE DATE', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = actionsFor(row).map((a) => ({ label: a.label, icon: a.icon, color: a.color, action: () => trigger(a.key, row) }));
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View tax record" aria-label="View tax record"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  const describe = (r) => ({
    title: r.filingPeriod,
    subtitle: r.taxId,
    status: r.status,
    actions: actionsFor(r).filter((a) => a.key !== 'delete').map((a) => <SecondaryButton key={a.key} icon={a.icon} onClick={() => trigger(a.key, r)}>{a.label}</SecondaryButton>),
    items: [
      ['Tax ID', r.taxId], ['Tax type', r.taxType], ['Tax entity', populatedName(r.taxEntity)], ['Filing period', r.filingPeriod], ['Currency', 'NGN'],
      ['Tax amount', money(r.taxAmount)], ['Due date', formatDate(r.dueDate)], ['Tax reference', r.taxReference || '—'], ['Status', statusLabel(r.status)],
      ...(r.status === 'paid' ? [
        ['Payment date', formatDate(r.paymentDate || r.paidAt)], ['Payment method', r.paymentMethod || '—'], ['Payment reference', r.paymentReference || '—'],
        ['Payment account', r.paymentAccount ? `${r.paymentAccount.accountCode} – ${r.paymentAccount.accountName}` : 'Default bank account'],
      ] : []),
    ],
    panels: [{ title: 'Remarks', text: r.remarks, empty: 'No remarks recorded.' }, r.paymentRemarks && { title: 'Payment remarks', text: r.paymentRemarks }],
    canEditDocs: r.status !== 'paid' && (canUpdate || canDecide),
  });

  const tiles = [
    { label: 'Total tax records', value: statValue(list.stats, 'total_records'), sub: 'All tax entries', icon: <FiList size={15} />, tone: 'green' },
    { label: 'Pending filings', value: statValue(list.stats, 'pending_filing'), sub: 'Awaiting submission', icon: <FiFileText size={15} />, tone: 'amber' },
    { label: 'Taxes paid', value: compactMoney(statValue(list.stats, 'paid_amount_this_year')), sub: 'Paid this financial year', icon: <FiDollarSign size={15} />, tone: 'red' },
    { label: 'Upcoming due', value: statValue(list.stats, 'due_soon'), sub: 'Drafts and pending filings due soon', icon: <FiClock size={15} />, tone: 'blue' },
  ];

  if (!canView) return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view tax records.</div>;

  const d = dlg.dialog;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Tax Management" subtitle="Track tax obligations, filings, and payment records" />
      <StatTiles tiles={tiles} loading={list.statsLoading && list.stats.length === 0} error={Boolean(list.statsError)} />

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search tax ID, entity, reference, period…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
          {canCreate && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Tax Record</PrimaryButton>}
        </ListToolbar>
        <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No tax records found." onRetry={list.reload}>
          <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No tax records found." />
        </DataState>
        <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      </div>

      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Tax Records" subtitle="Filter by tax type and filing status"
        fields={[
          { key: 'taxType', label: 'Tax type', options: TAX_TYPES.map((t) => ({ value: t, label: t })), allLabel: 'All types' },
          { key: 'status', label: 'Status', options: STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' },
        ]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && <RecordDrawer api={taxRecordService} id={viewId} refreshKey={localKey} onClose={() => setViewId(null)} describe={describe} detailsLabel="Tax Details" width="520px" />}
      {formFor && <TaxFormModal record={formFor === 'new' ? null : formFor} canSubmit={canUpdate} onClose={() => setFormFor(null)} onSaved={afterSave} />}
      {payFor && <PaymentModal record={payFor} canAttach={canUpdate || canDecide} onClose={() => setPayFor(null)} onSaved={afterSave} />}

      {d?.kind === 'submit' && <ConfirmModal title="Submit filing?" message="The record moves to Pending Filing; the filing can be marked as filed next." detail={d.record.taxId} confirmLabel="Submit Filing" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('submitFiling', d.record, `${d.record.taxId} submitted for filing`)} />}
      {d?.kind === 'filed' && <ConfirmModal title="Mark as filed?" message="Confirm the return has been filed with the revenue authority. Payment can then be recorded." detail={`${d.record.taxId} – ${d.record.taxType} ${d.record.filingPeriod}`} confirmLabel="Mark as Filed" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('markFiled', d.record, `${d.record.taxId} marked as filed`)} />}
      {d?.kind === 'delete' && <ReasonModal title="Delete filing?" message="This draft tax record will be permanently removed." detail={d.record.taxId} label="Reason for deletion" confirmLabel="Delete Filing" danger busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('remove', d.record, `${d.record.taxId} deleted`, reason)} />}
    </div>
  );
}
